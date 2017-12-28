+++
date = "2017-07-14T10:03:55+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "LED", "DBus", "resolution", "race condition", "default" ]
title = "GSoC part 8: the LED stack page"
categories = "Development"
series = "GSoC"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

Originally the plan for this week was to start working on the button mappings,
however together with my mentor I decided that it's better to do the LEDs first.
This is because I was sure I could finish this in a few days, and button
mappings is definitely going to take much longer than that. So, this week I'll
run you through the implementation of the LED stack page, and the coming weeks
I'll be working on button mappings, profile support and a proper welcome screen,
in that order.

### The LED stack page

A picture is worth more than a thousand words. A video, however, is priceless:

<video controls>
  <source src="/img/blog/gsoc-part-8/leds.webm" type="video/webm">
Your browser does not support the video tag.
</video>

As you can see, I deviated from the [mockup][led-mockup]. The mockup uses
multiple [`Gtk.ToggleButton`][togglebutton]s that are pressed (<q>active</q>) to
highlight the current mode. One thing that wasn't nice here is that to change a
current mode (e.g. to change the solid mode's color), you'd have to click an
already active button. This isn't obvious and so we iterated for a bit to find a
better approach, until we landed on what you see in the video. Note: the [off
page still needs an image][off-page] to indicate its empty state. If this is
something you can help out with, please get in touch!

The [pull request][pr-leds] notes the issues I stumbled upon while implementing
the LED stack page and its dialog, and the iterative design bit.

Firstly, changed values (even committed to the device) would not be remembered
in between dialog invocations. At first, I thought this was due to the fact that
the bindings only checked their DBus object's properties upon instantiation, and
not whenever they are retrieved (so a new setting would simply remain
invisible).  However, even after making sure that the latest value is always
queried directly, things still didn't work. We then found that ratbagd exposed
the [properties as constants][pr-ratbagd-led], but this still didn't fix the
issue. As it turned out, [`Gio.DBusProxy`][dbusproxy] wasn't updating its cached
properties because ratbagd wasn't emitting property changed signals for all of
its properties. My mentor [fixed][emit-properties-changed] this overnight (for
me at least; globally distributed software engineering at its finest!), only for
us to run into the next issue... &#128517;

As you can see in the video, the button label should change to reflect the new
LED mode after the user accepts the changes in the dialog. For some reason this
wasn't happening and the old label would be set, even though the dialog returned
the correct mode and the method that converts a mode to its string
representation was correct. Indeed, the correct mode was also being applied
to the device. At first I thought this was a pass by reference versus a pass by
value bug, but Python should support passing an object around and changing its
properties just fine. A quick test confirmed my thinking (*<q>yay, I'm not going
crazy just yet!</q>*); this does exactly what you'd expect it to:

```python
class Foo(object):
  def __init__(self, x):
    self._x = x

  @property
  def x(self):
    return self._x

  @x.setter
  def x(self, xx):
    self._x = xx

def modify(foo):
  foo.x = 10

foo = Foo(5)
print(foo.x)
modify(foo)
print(foo.x)
```

With some more thinking, even a pass by value versus a pass by reference would
be weird, since the changes *are* being applied correctly and the callback that
is called when an LED's mode changes was being called on the correct LED object.
I approached my mentor with this issue, who, with his years of experience
(&#128521;), was quick to smell a race condition in DBus.

1. We set the LED mode on DBus though the `SetMode(mode)` method on the LED
   object;
2. We query the DBus LED mode, which returns the old mode because that's what
   the [`Gio.DBusProxy`][dbusproxy] has;
3. Time passes, and we return to GLib's main loop which monitors DBus;
4. DBus' property changed signal arrives;
5. If we query the DBus LED mode now, it has the correct value.

Because there is no time between steps 1 and 2, the signal hasn't yet arrived
and the cached property isn't updated. The solution thus is to [explicitly and
immediately][pr-dbus] update the cached DBus properties when a setter method is
called. However, you only ever want to update a cached property if its setter
method actually applied the changes, so we needed to refactor
`_RatbagdDBus._dbus_call`. There were a bunch of options here (e.g. catching any
DBus exceptions and simply returning different error codes), but in the end I
went for raising different kinds of exceptions signaling different ratbag error
codes returned from the DBus method. I went this way because it 1) automatically
prevents the cached property from being updated when an exception is raised, 2)
is automatically propagated up the call chain to the UI (or any other user) that
can then decide what to do, and 3) it is the most Pythonic.

Finally, Piper now checks if the device supports resolutions and LEDs before it
shows those pages. Ratbag exposes device capabilities for precisely this reason,
but up until now I had simply forgotten about them. To make these capabilities
easier to work with (my device would support `CAP_SWITCHABLE_RESOLUTION` but not
`CAP_RESOLUTION`), my mentor [made sure][pr-cap] that "parent capabilities" such
as `CAP_RESOLUTION` are set before any child capabilities such as
`CAP_SWITCHABLE_RESOLUTION` are.

### Setting a default resolution

A leftover from last week's resolution stack page is that there is [no
way][issue-default-res] to set the default resolution yet. This week I attempted
to fix that, through [this PR][pr-default-res]. There may at any given time be
only exactly one default resolution, and hence a
[`Gtk.RadioButton`][radiobutton] initially seems like the best widget to use
here given that it itself enforces this behaviour so we don't have to do that
manually. However, it didn't look very nice and its intention also isn't clear
from a usability point of view.

To make it look prettier and to improve the usability, my mentor suggested I
move the widget into the revealer that appears when a resolution is clicked from
the list.  This also gives us more space so we can add a label describing what
the widget does. Initially I went with a [`Gtk.Switch`][switch] but later
changed this to a [`Gtk.CheckButton`][checkbutton].

This does mean that we now need to manually enforce that there is only exactly
one default resolution at any given time, but fortunately this isn't that
difficult:

```python
@GtkTemplate.Callback
def _on_default_toggled(self, check):
    # The user toggled us; set ourselves as the default.
    if check.get_active():
        self._resolution.set_default()

def _on_default_resolution_changed(self, resolution, default_index):
    if default_index == self._resolution.index:
        # It's us; set ourselves insensitive so that the user cannot have
        # zero default resolutions.
        self.default_check.set_sensitive(False)
    elif self.check.get_active():
        # We were the old default; unset ourselves and make ourselves
        # sensitive again.
        self.default_check.set_sensitive(True)
        self.default_check.set_active(False)
```

All of this would work nicely, if only the `DefaultResolutionChanged` signal
would be received by the `RatbagdResolution` objects. As it turns out, this
isn't happening because there is one such object for each resolution, with
object paths `/org/freedesktop/ratbag1/resolution/event13/p0/r0` (where `p0` and
`r0` encode the profile and resolution to encode for different profiles and
resolutions, and `event13` is the mouse under configuration) with interface
`org.freedesktop.ratbag1.Resolution`, while the `DefaultResolutionChanged`
signal is emitted by ratbagd on `/org/freedesktop/ratbag1` with the same
interface. [`Gio.DBusProxy`][dbusproxy] says the following for its `g-signal`
signal: *<q>Emitted when a signal from the remote object and interface that
proxy is for, has been received</q>*. So because the signal it receives isn't
for its object path (`.../resolution/event13/p0/r0`) it doesn't emit its
	`g-signal`.

The fix initially appears simple: just emit the signal on the resolution
object's path, so that it will receive it. That's exactly [what I
did][pr-signal], but as you can read there the next issue is that the signal is
now only emitted on the resolution that has just become the default. At the very
least it should also be emitted on the signal that *was* the default, so that it
knows it isn't anymore.

There are two ways to fix this issue:

1. Move the `DefaultResolutionChanged` (and `ActiveResolutionChanged`) signal up
   into the profile, or
2. Have a boolean property of `IsDefault` in the resolution objects.  This way
   we get to use DBus' `PropertyChanged` signals as they happen anyway, without
   the need for extra signals on our behalf.

The latter would mean that each class in Piper that has a `Ratbagd*` instance
(let's say a `RatbagdResolution` in this example) needs to connect to that
instance's `notify::is-default` signal that is emitted whenever this property
changes (automatically, by GObject). This is straightforward, but I'm not sure
how well it will work with profile switches.

The former would mean that each class in Piper that has a `Ratbagd*` instance
needs a reference to a profile, so that it can connect to the profile's
`default-resolution-changed` signal (again, just taking the `RatbagdResolution`
example here) and do the work from that callback. This will likely work better
with profile switches, albeit being a little less straightforward.

I'm not yet sure which of these will work best once I will implement profile
switching: there won't be just one profile to work with but all of them, and the
active one can change at any given time. In this case, it is likely that every
class in Piper needs a reference to a profile anyway, which will change
depending on the `active-profile-changed` signal emitted from `RatbagdDevice`
(currently `RatbagdProfile`, but this will have to be changed to prevent the
same issue we're having now with `RatbagdResolution`) to grab, for example, the
new profile's resolution to update.

My suggestion is thus to postpone this issue until I get around to implementing
profile support in a few weeks, so that we only have to change things once.

### Smaller changes

Last week I asked the question [<q>does every resolution have its own report
rate?</q>][report-rate]. The concensus then was to implement report rates per
profile, even though [this issue][issue-report-rate] was opened not much later.
It is now definitive that supporting per-resolution report rates isn't required,
so I [made the change][pr-report-rate] to make it per-profile. It is however not
much work at all to make it work per-resolution, so for devices that support
this we might just want to do it after all:

```diff
diff --git a/piper/resolutionspage.py b/piper/resolutionspage.py
index 9c7faa6..c0b580f 100644
--- a/piper/resolutionspage.py
+++ b/piper/resolutionspage.py
@@ -75,11 +75,11 @@ class ResolutionsPage(Gtk.Box):

     def _on_report_rate_toggled(self, button, rate):
         profile = self._device.active_profile
-        # TODO: currently no devices expose CAP_INDIVIDUAL_REPORT_RATE, but if
-        # so then we should check for this here and set it only on the relevant
-        # resolution.
-        for resolution in profile.resolutions:
-            resolution.report_rate = rate
+        if RatbagdResolution.CAP_INDIVIDUAL_REPORT_RATE in profile.active_resolution:
+            profile.active_resolution.report_rate = rate
+        else:
+            for resolution in profile.resolutions:
+                resolution.report_rate = rate

     @GtkTemplate.Callback
     def _on_row_activated(self, listbox, row):
```

In Python methods can return more than one value. In some cases, you are only
interested in some of them, in which case it is common to use an <q>anonymous
variable</q> which is often named `_`. Piper did this as well, but Piper is also
(planning on being) internationalized. In internationalized applications, it is
common to alias the `gettext()` function to `_`, so that strings can be marked
for translation using the `_(<some string>)` syntax. Using an underscore for
both `gettext()` and anonymous variables can be confusing and lead to
interference, so Piper [now uses a double underscore for anonymous
variables][pr-anon].

Last week's resolutions page contained a small bug that would mess up the
toggling of rows in the list: if toggling the same row twice and then toggling
another row, both the first and the second row would be toggled. The
[fix][pr-list] was rather straightforward and required resetting
`last_activated_row` to `None` in case the same row is toggled.

A widget's purpose might not always be immediately clear. In such cases, a
tooltip helps to understand what a widget does. As such, I [have
added][pr-tooltip] a tooltip to each control widget currently found in Piper.

Finally, we now have toned down device SVGs for the [Logitech G500 and
G500s][pr-svg] and soon for the [Logitech G303][pr-303]. Thanks!

This blog post is part of a [series](/series/gsoc/). You can read the next part about the button
stack page [here](/blog/gsoc-part-9) or the previous part about the
resolutions stack page [here](/blog/gsoc-part-7).

[led-mockup]: https://github.com/libratbag/piper/raw/wiki/redesign/leds.png
[togglebutton]: https://lazka.github.io/pgi-docs/Gtk-3.0/classes/ToggleButton.html
[off-page]: https://github.com/libratbag/piper/issues/45
[pr-leds]: https://github.com/libratbag/piper/pull/35
[pr-ratbagd-led]: https://github.com/libratbag/libratbag/pull/215
[dbusproxy]: https://lazka.github.io/pgi-docs/Gio-2.0/classes/DBusProxy.html
[emit-properties-changed]: https://github.com/libratbag/libratbag/pull/219
[pr-dbus]: https://github.com/libratbag/piper/pull/41
[pr-cap]: https://github.com/libratbag/libratbag/pull/223
[issue-default-res]: https://github.com/libratbag/piper/issues/31
[pr-default-res]:https://github.com/libratbag/piper/pull/36
[radiobutton]: https://lazka.github.io/pgi-docs/Gtk-3.0/classes/RadioButton.html
[switch]: https://lazka.github.io/pgi-docs/Gtk-3.0/classes/Switch.html
[checkbutton]: https://lazka.github.io/pgi-docs/Gtk-3.0/classes/CheckButton.html
[pr-signal]: https://github.com/libratbag/libratbag/pull/226
[pr-tooltip]: https://github.com/libratbag/piper/pull/46
[pr-svg]: https://github.com/libratbag/libratbag/pull/214
[pr-303]: https://github.com/libratbag/libratbag/pull/228
[report-rate]: /blog/gsoc-part-7#obstacle-4-does-every-resolution-have-its-own-report-rate
[issue-report-rate]: https://github.com/libratbag/libratbag/issues/202
[pr-report-rate]: https://github.com/libratbag/piper/pull/44
[pr-anon]: https://github.com/libratbag/piper/pull/43
[pr-list]: https://github.com/libratbag/piper/pull/32
