+++
date = "2017-07-21T17:35:55+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "button", "capture", "modifier" ]
title = "GSoC part 9: the button stack page"
categories = ["Development"]
series = "Google Summer of Code"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

When I discussed this project with my mentor before GSoC, he told me that the
button mappings were going to be the most complicated piece. This week I've been
working on precisely that and, well, let's just say he wasn't wrong &#128521;

If you've been following along on GitHub, you're probably thinking that it was a
slow week. Indeed, there hasn't been that much activity this week as in
previous weeks. I've mostly just been stuck in my own little branch iterating
and debugging away to get these pesky buttons into shape.

### The button stack page

As usual I'll discuss the various obstacles I've hit this past week. All of that
work has resulted in the following work-in-progress:

<video controls>
  <source src="/img/blog/gsoc-part-9/progress.webm" type="video/webm">
Your browser does not support the video tag.
</video>

The [mockup][button-mockup] intentionally left the button configuration dialog
empty: too much was unclear to me at the time of making the mockups and I wanted
the freedom to experiment for a bit to iterate towards the best design.

At first, I tried a dialog with a different stack page for each configuration
(for lack of a better word) that you can set on a button. Ratbag has, at the
moment, four such configurations:

1. button mapping, where a physical button is mapped to another, logical button.
   This way you can for example make the right mouse button emit a left mouse
   button click when clicked;
2. key mapping, where a physical button is mapped to a series of key presses on
   the keyboard. This way you can for example make a thumb button emit
   <kbd>:</kbd>+<kbd>q</kbd> to always have a way out of Vim &#128521;;
3. special mappings, where a physical button is mapped to a special,
   mouse-specific function. This way you can for example make the right mouse
   button switch profiles;
4. macros, where a physical button may be assigned a series of key events or
   waiting periods. This way you can for example make a thumb button press two
   different keys with a certain interval in between.

This first iteration looked like this:

![First iteration](/img/blog/gsoc-part-9/first-iteration.png)

Those numbers should be button descriptions such as <q>Left mouse button
click</q>, but because my device doesn't return those ([yet][issue-types]) it
falls back to just button numbers. However, as you've probably already concluded
yourself, many of the different button options are quite similar. In fact, I bet
that as a user you won't notice the difference between a button mapping and a
special mapping. Similarly, macros are just a superset of key mappings: in
addition to only key presses, a macro can also work with key releases and time
intervals. There is talk among libratbag developers to merge the key mapping and
macro functionality into one for precisely this reason.

Because the options are very much alike I've slowly been doing away with the
individual stack pages, to what you've just seen in the video. I'm not sure if
this is the final design; I might switch it around to something like [GNOME
Control Center's Wacom panel][gcc-wacom]. In any case, it needs more work, as
you've probably also concluded already from the visual bug showing!

### Technical details

As mentioned, the button page is the most complex part of Piper. This week has
had a somewhat larger amount of head &rarr; wall than usual; let me explain.

To capture keys as shown in the video, the button dialog needs to first grab the
keyboard and then process the key events in its `do_key_press_event` function.
This function gets a [`Gdk.EventKey`][eventkey] that has several fields related
to the event. Of use to us are the following:

* a `hardware_keycode` field that gives the raw keycode of the pressed or
  released key. This keycode is the number of the physical key on the keyboard.
* a `keyval` field as a <q>name</q> of the logical *symbol* that was pressed or
  released. This keyval is decided by the *level*, which indicates in a vertical
  direction which symbol is used (for example, pressing the key with number 1 on
  it has keyval 1 for level 0 and keyval ! for level 1), and the *group*, which,
  on a keyboard with more than 1 group (US keyboards typically have a single
  group) indicates in a horizontal direction which symbol is used. For example,
  on a typical [Scandinavian keyboard][keyboard] there are several symbols on
  the same key in a horizontal direction.
* an `is_modifier` field that tells whether the pressed or released key is a
  modifier key. Modifier keys are for example <kbd>Control</kbd> or
  <kbd>Alt</kbd>.
* finally, a `state` field that gives a bit-mask representing the state of the
  modifier keys.

Before we continue, it's important to note that at the moment ratbag expects a
keymap signature of a list, with the first item the keycode of the regular key
followed by zero or more keycodes of modifiers. Now you might think that we can
just capture a key press, take the `keycode` and the `state` mask and extract
from the state mask the keycodes of the modifiers. That's exactly what my first
approach was, and it failed for the following reason: converting actual modifier
keypresses into a bit-mask is lossy. If you look at your keyboard, you'll see
for example a left and a right <kbd>Control</kbd> key; no matter which one is
pressed, there is a single bit in the bit-mask representing <kbd>Control</kbd>.
There is thus no way to accurately determine from the bit-mask which modifier
keycodes were pressed.

The next attempt is then to capture the key events of the modifier keys
individually, instead of collectively with the key event of a regular key. To do
so, we need to cache individual key presses if they are modifier keys, and apply
the whole bunch as soon as a regular key is pressed.  Remember the `is_modifier`
field of `Gdk.EventKey`? Yea, [that's not going to work][is_modifier]: this
field is not exposed from C through PyGObject because it *<q>is a bit of a
misnomer. What you want is the `state` field</q>*. Hm, I guess they didn't think
of this use-case. *<q>Well</q>*, I hear you think, *<q>why don't you just check
the `state` bit-mask then?</q>*. Because that is always 0 for individual
modifier keypresses: it contains the modifiers that apply before the key press
happens, and when we press e.g. <kbd>Control</kbd>, it isn't pressed before we
press it.

My current solution is to "fix" the `is_modifier` field in `Gdk.EventKey` by
checking the `Gdk.EventKey`'s `keyval` field against a static list of known
modifier keyvals. I can do this because I also "fix" the `state` bit-mask by
masking out all modifiers keys except for the defaults used by Gtk. These
default modifiers keys depend on the Gdk backend in use, but will typically
include those in the list.

```python
_MODIFIERS = [
    Gdk.KEY_Shift_L,
    Gdk.KEY_Shift_R,
    Gdk.KEY_Shift_Lock,
    Gdk.KEY_Hyper_L,
    Gdk.KEY_Hyper_R,
    Gdk.KEY_Meta_L,
    Gdk.KEY_Meta_R,
    Gdk.KEY_Control_L,
    Gdk.KEY_Control_R,
    Gdk.KEY_Super_L,
    Gdk.KEY_Super_R,
    Gdk.KEY_Alt_L,
    Gdk.KEY_Alt_R,
]

event.is_modifier = event.keyval in self._MODIFIERS
event.state &= Gtk.accelerator_get_default_mod_mask()
```

There is another such workaround to display the correct modifiers in the
[`Gtk.ShortcutLabel`][shortcutlabel]: we need to reconstruct a `state` bit-mask
from a list of keyvals. Again, we only check for those same default modifiers
and simply flag the correct bit:

```python
mask = Gdk.ModifierType(0)
for (_, keyval) in self._modifiers:
    if keyval == Gdk.KEY_Shift_L or keyval == Gdk.KEY_Shift_R or keyval == Gdk.KEY_Shift_Lock:
        mask |= Gdk.ModifierType.SHIFT_MASK
    elif keyval == Gdk.KEY_Hyper_L or keyval == Gdk.KEY_Hyper_R:
        mask |= Gdk.ModifierType.HYPER_MASK
    elif keyval == Gdk.KEY_Meta_L or keyval == Gdk.KEY_Meta_R:
        mask |= Gdk.ModifierType.META_MASK
    elif keyval == Gdk.KEY_Control_L or keyval == Gdk.KEY_Control_R:
        mask |= Gdk.ModifierType.CONTROL_MASK
    elif keyval == Gdk.KEY_Super_L or keyval == Gdk.KEY_Super_R:
        mask |= Gdk.ModifierType.SUPER_MASK
    elif keyval == Gdk.KEY_Alt_L or keyval == Gdk.KEY_Alt_R:
        mask |= Gdk.ModifierType.MOD1_MASK
```

Masking the modifier bit-mask means that at least for now, these workarounds
should be fine. The solution that we want to work towards is to make ratbag not
care about the signature of its keymap, so that Piper doesn't have to either. In
this case we can just capture every key press in the same manner, without having
to differ modifiers from regular keys. Another possible solution is to merge key
mappings and macros, as macros already do not have a specific signature unlike
the key mappings. Until then, workarounds it is.

The other big problem I encountered this week is the reverse of the above,
basically. When the button dialog opens, we want to display the current key
mapping, if any. Keycodes are stored on the device as defined in `linux/input.h`
and as used by evdev. To go from Gdk keycodes to evdev keycodes is rather
straightforward: just subtract the magical number of 8 from the keycode. This
number stems from the fact that X originally reserved keycodes 0 through 8.
Going the other way then is as simple as *adding* 8 to the evdev keycode.
However, to be able to display the shortcut in a `Gtk.ShortcutLabel` we also
need the keyval. If you remember the explanation from above, to get a keyval
from a keycode we also need to know the level and the group. This information is
simply not available from the device, and hence we cannot accurately map a
keycode to a keyval. My mentor [said][whot] it's oke to inform the user we are
capturing *key codes* and not *key symbols*, which means I can use
[`Gdk.Keymap.get_entries_for_keycode`][entries] with a level and group of 0.
This will at the very least give the correct physical key; only the symbol might
be off. At least you'll only notice this in the initial state of the dialog, and
only if you 1) have a keyboard with groups and 2) have actually set such a
special key.

All of this work can be followed in the [pull request][pr-buttons], where you
will also find the discussion that I gave an overview of here. If you're
interested and have a better idea to fix these problems, please do chime in and
tell us!

### Smaller changes

In other news, support for enabling and disabling profiles is [just around the
corner][pr-profile]. This is required for the next step, in which I'll be adding
support for profiles to Piper.

This blog post is part of a [series](/series/google-summer-of-code/). You can read the next part about finishing
the button page [here](/blog/gsoc-part-10) or the previous part about the LED
stack page [here](/blog/gsoc-part-8).

[button-mockup]: https://github.com/libratbag/piper/raw/wiki/redesign/buttons.png
[issue-types]: https://github.com/libratbag/libratbag/issues/233
[gcc-wacom]: https://github.com/gnome-design-team/gnome-mockups/raw/master/system-settings/tablets/button-mapping.png
[eventkey]: https://lazka.github.io/pgi-docs/Gdk-3.0/classes/EventKey.html
[keyboard]: https://datordax.se/info_sheets/das_keyboard_nordic_layout.jpg
[is_modifier]: https://bugzilla.gnome.org/show_bug.cgi?id=752784
[shortcutlabel]: https://lazka.github.io/pgi-docs/Gtk-3.0/classes/ShortcutLabel.html
[whot]: https://github.com/libratbag/piper/pull/47/#discussion_r128686138
[entries]: https://lazka.github.io/pgi-docs/#Gdk-3.0/classes/Keymap.html#Gdk.Keymap.get_entries_for_keycode
[pr-buttons]: https://github.com/libratbag/piper/pull/47
[pr-profile]: https://github.com/libratbag/libratbag/pull/238

