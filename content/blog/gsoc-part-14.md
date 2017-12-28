+++
date = "2017-08-23T13:01:32+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "macro", "localization", "property", "exception" ]
title = "GSoC part 14: final code changes"
categories = "Development"
series = "GSoC"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

Well, this really is the last week of my Summer of Code! This will be a short
update on the final changes made since my [last update](/blog/gsoc-part-13) on
Friday, which will be followed by a proper blog post for my final submission
later this week.

Last week I mentioned a few items that were
[work-in-progress](/blog/gsoc-part-13#work-in-progress). The search field for
the button mapping dialog has been merged, including its revamp of the dialog's
UI. The resolutions stack page now highlights the active resolution within the
list, and, most importantly, Piper can now be translated completely into your
native language! Here's Piper fully translated in Dutch:

<video controls>
  <source src="/img/blog/gsoc-part-14/dutch.webm" type="video/webm">
Your browser does not support the video tag.
</video>

I also reported on the work that was still to be done, which we'll get to now.

### Piper shouldn't crash when libratbag returns an error

Libratbag returns error codes to clients over DBus, it can for example return
`RATBAG_ERROR_CAPABILITY` that has a value of -1001 (a <q>random</q> number so
as to not conflict with `errno`) to indicate that a requested change is beyond a
device's capabilities.

The bindings check for these error codes, and in case one other than
`RATBAG_SUCCESS` is returned it will raise the appropriate exception:

```python
class RatbagErrorCode(IntEnum):
    RATBAG_SUCCESS = 0

    """An error occured on the device. Either the device is not a libratbag
    device or communication with the device failed."""
    RATBAG_ERROR_DEVICE = -1000

    """Insufficient capabilities. This error occurs when a requested change is
    beyond the device's capabilities."""
    RATBAG_ERROR_CAPABILITY = -1001

    """Invalid value or value range. The provided value or value range is
    outside of the legal or supported range."""
    RATBAG_ERROR_VALUE = -1002

    """A low-level system error has occured, e.g. a failure to access files
    that should be there. This error is usually unrecoverable and libratbag will
    print a log message with details about the error."""
    RATBAG_ERROR_SYSTEM = -1003

    """Implementation bug, either in libratbag or in the caller. This error is
    usually unrecoverable and libratbag will print a log message with details
    about the error."""
    RATBAG_ERROR_IMPLEMENTATION = -1004


"""A table mapping RatbagErrorCode values to RatbagError* exceptions."""
EXCEPTION_TABLE = {
    RatbagErrorCode.RATBAG_ERROR_DEVICE: RatbagErrorDevice,
    RatbagErrorCode.RATBAG_ERROR_CAPABILITY: RatbagErrorCapability,
    RatbagErrorCode.RATBAG_ERROR_VALUE: RatbagErrorValue,
    RatbagErrorCode.RATBAG_ERROR_SYSTEM: RatbagErrorSystem,
    RatbagErrorCode.RATBAG_ERROR_IMPLEMENTATION: RatbagErrorImplementation
}

def _dbus_call(self, method, type, *value):
    # Calls a method synchronously on the bus, using the given method name,
    # type signature and values.
    #
    # It the result is valid, it is returned. Invalid results raise the
    # appropriate RatbagError* or RatbagdDBus* exception, or GLib.Error if
    # it is an unexpected exception that probably shouldn't be passed up to
    # the UI.
    val = GLib.Variant("({})".format(type), value)
    try:
        res = self._proxy.call_sync(method, val,
                                    Gio.DBusCallFlags.NO_AUTO_START,
                                    2000, None)
        if res in EXCEPTION_TABLE:
            raise EXCEPTION_TABLE[res]
        return res.unpack()[0]  # Result is always a tuple
    except GLib.Error as e:
        if e.code == Gio.IOErrorEnum.TIMED_OUT:
            raise RatbagdDBusTimeout(e.message)
        else:
            # Unrecognized error code; print the message to stderr and raise
            # the GLib.Error.
            print(e.message, file=sys.stderr)
            raise
```

There's nothing wrong with this approach and it does in fact work fine. The
problem occurs when the `_dbus_call` method is used within a `GObject.Property`
setter method, because the `GObject.Property` decorator [doesn't raise
exceptions](https://stackoverflow.com/questions/19639089/no-exceptions-from-gobject-properties-in-pygobject).

This means that the exceptions raised from `_dbus_call` have to be caught within
these setter methods and cannot be left up to the clients to resolve. The only
way out of this then would be to return values from the setters, but then we
might as well directly return the libratbag error codes instead of raising
exceptions. Not only is that the wrong approach, it would also require **all**
usage of *any* setter method to check for return codes. Even if we wanted this,
the `GObject.Property` decorator doesn't allow you to return any values, either.
An alternative would be to set a sensible value upon error, or simply do nothing
at all. As you can see, neither solution is, well, a solution.

The only sane alternative is to do away with using `_dbus_call` from within
setter methods. After a quick inspection, there were only four such methods ([one
of which will be removed in due
time](https://github.com/libratbag/libratbag/issues/243)), all of which were
using `_dbus_call` to set a read-only DBus property. There is no reason
whatsoever that these properties should be read-only with a setter method (in
fact, we actively refactored the DBus interface to remove such inconsistencies),
so [I made these properties read-write and removed the explicit
setters](https://github.com/libratbag/libratbag/pull/290). After this it was
simply a matter [updating the bindings
accordingly](https://github.com/libratbag/piper/pull/148), and voilà, issue
solved. Oh, and [the bindings' setter methods also don't return values
anymore](https://github.com/libratbag/piper/pull/145), as this never worked in
the first place because the `GObject.Property` always returns the set value.

### Macro rework

Last week I mentioned an issue with [correctly restoring the macro preview label
upon cancel](https://github.com/libratbag/piper/issues/141). There was another
issue that I forgot to mention: [the macro was displayed using its integer
keycodes](https://github.com/libratbag/piper/issues/100). For the latter issue,
we could easily copy the `KeyStroke::_update_macro` method to `ButtonsPage`, but
that results in unnecessary duplication. To solve this, I initially moved the
`_update_macro` method to be a new property on `RatbagdButton` instead:

```python
@GObject.Property
def macro_str(self):
    """A string representation of the current macro."""
    keys = []
    for (type, val) in self.macro:
        if type == RatbagdButton.MACRO_KEY_PRESS:
            keys.append("↓{}".format(ecodes.KEY[val]))
        elif type == RatbagdButton.MACRO_KEY_RELEASE:
            keys.append("↑{}".format(ecodes.KEY[val]))
        elif type == RatbagdButton.MACRO_WAIT:
            keys.append("{:.2f}s".format(val / 1000.0))
    return " ".join(keys)
```

My mentor then rightfully pointed out that using a `*_str` method (in Python, at
least) is an indication that you should be using a proper class instead. This
was the catalyst to a large refactoring, where I removed the `KeyStroke` class
and introduced a `RatbagdMacro` class in the bindings instead. This class'
responsibility is to abstract macros instead of the `KeyStroke` class, that
never really had a good place in the architecture to begin with: it abstracted
macros, but was also responsible for processing key events (and thus has
knowledge of both evdev and Gdk keycodes) and its lifetime was tied to that of a
button mapping dialog.

Intead, we now have a `RatbagdMacro` to abstract over macros, needing to know
only evdev keycodes. It uses `__str__` to give a string representation of the
macro it represents, and is not tied to the lifetime of the button dialog nor
does it process key events. Processing key events is now done entirely in
`ButtonDialog`, which is now responsible for mapping Gdk keycodes to their evdev
counterparts (see [part 9](/blog/gsoc-part-9)), checking key validity and
instantiating a new `RatbagdMacro` for every capture-phase, correctly restoring
the macro preview labels upon cancel. I'm sure that all of this is much better
explained by [the actual
diff](https://github.com/libratbag/piper/pull/136/commits/38e6843084d4bc58e921d3a877e9e9fbe9b675fd).

After this refactoring, actually displaying the macros in the buttons stack page
was [*extremely*
straightforward](https://github.com/libratbag/piper/pull/136/commits/6dd64f661e2f51ae41d12e08ff76a18f5b708490).
I also removed the checking for modifiers for Enter and Escape, as for example
pressing Enter with NumLock wouldn't accept a macro. Finally, you can now press
the Apply button directly from capturing a macro in order to apply it.

An issue with the way that macros were printed in Piper could lead to the
following, obviously unwanted, situation:

![A long macro extending the UI](/img/blog/gsoc-part-14/long_macro.png)

We therefore automatically break the line after 30 characters, resulting in a
much better behavior:

![A long macro no longer extending the UI](/img/blog/gsoc-part-14/long_macro_fixed.png)

We made the same change for the preview label inside the button mapping dialog's
list and the buttons displayed in the configuration stack pages. We also removed
the `KEY_` prefix in front of every key, and we use `↓`, `↑` and `↕` to denote a
key press, a key release and a key press immediately followed by an identical
key release, respectively.

With these changes, the programming part of my Summer of Code is now over. In
the next few days I'll publish a final blog post that will form my final
submission, and with that I'll officially finish Google Summer of Code. Until
then!

This blog post is part of a [series](/series/gsoc/). You can read the last part about the code
submission [here](/blog/gsoc-part-15) or the previous part about saving the
planet [here](/blog/gsoc-part-13).
