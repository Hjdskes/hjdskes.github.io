+++
date = "2017-08-11T15:35:37+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "button", "rewrite" ]
title = "GSoC part 12: the finishing touches"
categories = "Development"
series = "GSoC"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

Last week I shared the news that all large features had been implemented; all
that was left were issues raised by GNOME contributors when my mentor demoed my
progress over GUADEC. This week I've just been chugging away on those issues;
let me show you.

### Obvious save button is.. not obvious?

[Hadess](http://www.hadess.net/)
[noted](https://github.com/libratbag/piper/issues/69) that the save button
wasn't obvious when my mentor demoed Piper to him; I already mentioned this last
week: the icon is a <q>save to disk</q> icon and it's not obvious at first
glance that you have to press it to write the changes you made to the device. I
discussed that we want to go for a time-based commit, where the changes are
committed to the device automatically after certain events (e.g. switching stack
pages) or after a certain interval of inactivity. Since that will require more
work and is thus something for a later version, I went with the other options to
at least solve the problem for now:

<video style="max-width: 110%; width: 110%;margin-left: -4%" controls>
  <source src="/img/blog/gsoc-part-12/commit.webm" type="video/webm">
Your browser does not support the video tag.
</video>

As you can see, the icon has been replaced with text and the button is now
insensitive when there are no changes to be committed. When there are, the
button is sensitive and the `suggested-action` CSS class is applied to the
button, in order to draw the user's attention that something needs to be
committed. You can view the pull request
[here](https://github.com/libratbag/piper/pull/101).

### Shutdown confirmation

Related to the above (and unsurprisingly also suggested by hadess) is asking for
confirmation when the user attempts to close Piper with unsaved changes:

<video style="max-width: 110%; width: 110%;margin-left: -4%" controls>
  <source src="/img/blog/gsoc-part-12/shutdown.webm" type="video/webm">
Your browser does not support the video tag.
</video>

This shows the versatility of the perspective abstraction; all it takes is
adding a single new property to each perspective:

```python
def can_shutdown(self):
    """Whether this perspective can safely shutdown."""
    for profile in self._device.profiles:
        if profile.dirty:
            return False
    return True
```

This property signals whether a perspective can safely shutdown. On a [delete
event](https://lazka.github.io/pgi-docs/Gtk-3.0/classes/Widget.html#Gtk.Widget.signals.delete_event),
the window checks all its perspectives' properties and if one perspective
signals that it cannot safely shutdown, it presents the dialog:

```python
def do_delete_event(self, event):
    for perspective in self.stack_perspectives.get_children():
        if not perspective.can_shutdown:
            dialog = Gtk.MessageDialog(self, Gtk.DialogFlags.MODAL,
                                       Gtk.MessageType.QUESTION,
                                       Gtk.ButtonsType.YES_NO,
                                       _("There are unapplied changes. Are you sure you want to quit?"))
            response = dialog.run()
            dialog.destroy()

            if response == Gtk.ResponseType.NO or response == Gtk.ResponseType.DELETE_EVENT:
                return Gdk.EVENT_STOP
    return Gdk.EVENT_PROPAGATE
```

### Device (dis)connects

This was the last unimplemented feature that my mentor and I agreed Piper had to
have when we came up with the GSoC proposal. I saved it for last because it's
quite a niche case to own (let alone use simultaneously) two devices, but it had
to be done at some point. The welcome perspective was already implemented [last
week](/blog/gsoc-part-11#perspectives); it was simply a matter of [adding the
right signals to the ratbagd
bindings](https://github.com/libratbag/piper/pull/97/commits/0b27bf912f66f4c92f18cb70b1f2369aa35da648),
[fixing said
bindings](https://github.com/libratbag/piper/pull/97/commits/84a50882d11526a29a27c0915fd27bb23542cc2f),
[adding methods to add and remove devices from the welcome
perspective](https://github.com/libratbag/piper/pull/97/commits/d93a3ba570cc8fc6d7c4dd1f6bb575524545b804)
and [connecting the
dots](https://github.com/libratbag/piper/pull/97/commits/062f881951b6812242a7e2a34fae417f73fe30b0).
For the last step, it was a bit of puzzling to figure out all the scenarios but
I believe I've got them all:

When a device is added and there:

* is no device connected currently → immediately configure the connected device
* are devices currently connected and we are in the welcome perspective → add
  the new device to the list
* is (are) device(s) currently connected and we are the in mouse perspective →
  make the back button visible (see below)

When a device is removed and:

* the removed device is the one currently being edited → error perspective
* there is (are) device(s) currently connected and we are in the welcome
  perspective → remove it from the list. If it was the last device, display the
  error perspective
* there are devices currently connected and we are configuring another device in
  the mouse perspective → hide the back button if required

Of course you can mix and match these, for example if you are configuring a
device, disconnect it and then connect it again you'll jump straight back into
editing it.

### Back button

When multiple devices are connected, you might want to configure more than
one as well. It is inconvenient to have to close and open Piper again, so for
this scenario I have given perspectives the option to declare whether they want
a back button to be shown, which will take the user back to the welcome
perspective to switch between devices:

<video style="max-width: 110%; width: 110%;margin-left: -4%" controls>
  <source src="/img/blog/gsoc-part-12/back.webm" type="video/webm">
Your browser does not support the video tag.
</video>

Again we add another property to the perspectives interface:

```python
@GObject.Property
def can_go_back(self):
    """Whether this perspective wants a back button to be displayed in case
    there is more than one connected device."""
    return True
```

This allows the window class to insert a back button into the perspectives'
titlebars and prevents all perspectives of having to add it themselves:

```python
def _add_perspective(self, perspective, ratbag):
    self.stack_perspectives.add_named(perspective, perspective.name)
    self.stack_titlebar.add_named(perspective.titlebar, perspective.name)
    if perspective.can_go_back:
        button_back = Gtk.Button.new_from_icon_name("go-previous-symbolic",
                                                    Gtk.IconSize.BUTTON)
        button_back.set_visible(len(ratbag.devices) > 1)
        button_back.connect("clicked", lambda button, ratbag:
                            self._present_welcome_perspective(ratbag.devices),
                            ratbag)
        ratbag.connect("notify::devices", lambda ratbag, pspec:
                       button_back.set_visible(len(ratbag.devices) > 1))
        perspective.titlebar.add(button_back)
        # Place the button first in the titlebar.
        perspective.titlebar.child_set_property(button_back, "position", 0)
```

That's a small amount of code for another large dose o' polish!

### Other smaller changes

In making ratbagd use enums everywhere as opposed to strings for some
properties, the `ResolutionsPage` was left behind and couldn't display which
buttons were assigned special mappings that relate to resolutions. I
[fixed](https://github.com/libratbag/piper/pull/95) that this week; you can see
it work again in the videos above.

Last week I [dropped indices from the UI](/blog/gsoc-part-11#GUADEC-issues), but
this left the resolution rows looking quite empty. The solution is to simply
make them [less wide](https://github.com/libratbag/piper/pull/94), although this
might change when we cannot fix the range of the resolution scale
logarithmically or by simply limitting it, as discussed in the linked pull
request and [this issue](https://github.com/libratbag/piper/issues/68).

The last noteworthy change of this week is that the key capture for macros now
also supports [key releases](https://github.com/libratbag/piper/pull/106), but
this isn't merged yet. We decided to
[drop](https://github.com/libratbag/piper/issues/62) button capture for now, as
this isn't (yet?) properly supported by libratbag.

That's it for this week! The coming week will be more of the same: adding spit
'n polish where it is needed the most.

This blog post is part of a series. You can read the next part about saving the
planet [here](/blog/gsoc-part-13) or the previous part about the welcome screen
[here](/blog/gsoc-part-11).
