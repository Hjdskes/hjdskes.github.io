+++
date = "2017-08-04T15:06:40+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "profiles", "buttons", "GUADEC" ]
title = "GSoC part 11: all large features are done!"
categories = "Development"
series = "Google Summer of Code"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

When I proposed the project with my mentor, we worked out a bunch of features
that the new Piper should have. These are listed in the [Redesign
Wiki](https://github.com/libratbag/piper/wiki/Piper-Redesign), but here's a
high-level summary:

1. A welcome screen, presenting a list of connected and supported devices.
2. An error screen, presenting any problems in a user-friendly manner.
3. The main screen, presenting the configuration pages:
  1. A page to configure resolutions (see part [7](/blog/gsoc-part-7))
  2. A page to configure button mappings (see parts [9](/blog/gsoc-part-9) and
     [10](/blog/gsoc-part-10))
  3. A page to configure LEDs (see part [8](/blog/gsoc-part-8))
4. Support for device profiles (see part [9](/blog/gsoc-part-9) for the start on
   this).

This week, I finished the remaining items! You would think I'm done with Google
Summer of Code now, but alas, my mentor opened quite a few issues from demoing
Piper to a bunch of awesome people while at GUADEC! That's oke though, I
wouldn't know what else to do with my summer anyway... &#x1f609; Before I get
lost in dreaming about the summer that could have been, let's get to the point!

### *Really* finishing the button page

Last week I said that the button page was done and pending a review before being
merged. While it was pending for review, it turned out it wasn't really ready to
be merged just yet: due to cleaning up the history and rebasing the work on the
other changes such as the DBus interface rewrite, some things got left behind
resulting in a not-really-functional button dialog. Fortunately it wasn't all
entirely my fault; while debugging [the
issues](https://github.com/libratbag/piper/pull/47#issuecomment-319015491) I
found that `RatbagdButton` doesn't emit `PropertyChanged` signals for its
`ActionType` property, which means that Piper doesn't get notified when this
property changes. The [fix](https://github.com/libratbag/libratbag/pull/264) was
rather straightforward and together with [an
update](https://github.com/libratbag/piper/pull/47/commits/27062a2b59e3f9846d568bac7b29a97c69bf32ab)
to the bindings resolved most of the issues. Finally, the button page was
*really* done (yes, really!) and it is now merged!

### Profiles!

Last week I also added the widgets to Piper to support
[profiles](/blog/gsoc-part-10#beginning-the-work-on-profiles). The second, more
difficult part was to come up with an architecture that threaded a profile
change in the least intrusive manner.  Supporting profiles means that all
widgets

1. update their state to reflect new values in the new profile. For example, a
   resolution scale displaying resolution 0's DPI of 50 in profile 0 should,
   when the profile changes to 1, display resolution 0's DPI of 100 in profile 1
   (if resolution 0 in profile 1 has a resolution of 100 of course, but bear
   with me here).
2. apply their changes to the correct resolution. Using the same example, the
   scale should now change the DPI of resolution 0 in profile 1, and not
   resolution 0 in profile 0.

For this to work, each widget needs to be aware of profile changes so that it
can retrieve the new profile, through which it can retrieve the setting it
controls in order to perform items 1 and 2 above. For example, a resolution
scale controlling resolution 0 for profile 0, should now retrieve resolution 0
from profile 1 and control that. I envisioned three ways to implement this:

1. Pass the list of all profiles to each object that needs to react to profile
   changes. These objects then connect to each profile's `notify::is-active`
   signal. In this callback they then retrieve the new active profile and update
   themselves as they please. I didn't like this approach because it requires
   passing the full list of resolutions to each object.
2. Emit a `profile-changed` signal on the device. This way, an object can
   connect to the `RatbagdDevice::profile-changed` signal, where the new active
   profile is passed to the callback. This approach is better because it doesn't
   require passing the list of all profiles to each object, but only the device.
   Many objects already need the device anyway, so this doesn't add much
   overhead.
3. Have each object that needs to react to profile changes implement a certain
   method (.e.g `on_profile_changed`), where this method is called recursively
   by each parent on its children (e.g. `ResolutionsPage` calls it on each
   `ResolutionRow`), starting from `Window`. I didn't like this because it would
   require some kind of (abstract) base class or interface to ensure that each
   class implements this method, a concept which is quite alien to Python and
   thus hard to enforce.

I proposed all approaches to my mentor, who agreed that number two was the best
one. After this was worked out, implementing profiles wasn't much work at all,
confirming that we chose the right approach. You can check [the
commits](https://github.com/libratbag/piper/pull/73) for the individual widgets
to see how easy this was; but all in all I estimate that the actual threading
and updating the widgets is less than a hundred lines of code.

### Perspectives?

From the much too abstract list of features in the beginning of this post, the
only items that aren't linked to are the welcome and error screens. No, I didn't
forget about those; I just saved those for last. To me, it was the least
essential feature as owning more than one device, let alone using them
simultaneously, is a niche case. As it turns out, however, the changes I made
while implementing these screens also pave the way for eventual [keyboard
support](https://github.com/libratbag/libratbag/issues/172). Let me explain!

The welcome and error screen both provide a different <q>view</q> into the same
application window. If we add the configuration screen, that gives three such
different views. To allow for these different views, I added the concept of a
<q>perspective</q>, which I define as a certain view into Piper.

A perspective needs to implement an interface of sorts (something something
Python) with two methods: one to retrieve the name of the perspective, and
another to retrieve its titlebar widget. Different scenarios can then fully
control Piper's window by providing their own main- and titlebar widget.

Adding the perspectives is simply a
matter of the iterating through them in `Window`'s constructor:

```python
def __init__(self, ratbag, *args, **kwargs):
    Gtk.ApplicationWindow.__init__(self, *args, **kwargs)
    self.init_template()

    perspectives = [ErrorPerspective(), MousePerspective(), WelcomePerspective()]
    for perspective in perspectives:
        self._add_perspective(perspective)

def _add_perspective(self, perspective):
    self.stack_perspectives.add_named(perspective, perspective.name)
    self.stack_titlebar.add_named(perspective.titlebar, perspective.name)
```

Setting a perspective is a matter of finding the widget from the `Gtk.Stack` and
making it active. For example, for the `ErrorPerspective`:

```python
def _present_error_perspective(self, message, detail):
    error_perspective = self.stack_perspectives.get_child_by_name("error_perspective")
    error_perspective.set_message(message)
    error_perspective.set_detail(detail)

    self.stack_titlebar.set_visible_child_name(error_perspective.name)
    self.stack_perspectives.set_visible_child_name(error_perspective.name)
```

The only part I don't like here is that the `Window` needs to know the
perspective names to find them in the stack, but other than that this makes for
a quite clean implementation, fully adhering to the single responsibility
principle. You can check this for yourself in the [pull
request](https://github.com/libratbag/piper/pull/84).

### GUADEC issues

As I mentioned last week, my mentor was at [GUADEC](https://2017.guadec.org/)
together with bentiss. While there, he demoed Piper to GNOME designers and other
contributors. I'm pretty happy with the result, as the issues pointed out are
all relatively minor; I think the lack of major issues is a sign we're doing
something right &#9786;

Firstly one issue that I fixed already is that users generally [aren't interested
in indices](https://github.com/libratbag/piper/pull/91), especially not those
that start at zero (*<q>normal people start counting at one</q> -- Jakub
Steiner*).

Secondly, the largest issue is probably that [the save button is not
obvious](https://github.com/libratbag/piper/issues/69): the icon is a <q>save to
disk</q> icon and it's not obvious at first glance that you have to press it to
write the changes you made to the device. For the former, it'd help to replace
the image with text, such as <q>Save</q> or <q>Write to Device</q>, while for
the latter we might want to highlight or flash the button whenever a profile is
dirty. While I like the latter, I'm not a fan of replacing the image with text.
Luckily, bentiss suggested that we should do away with explicit saving and
implement a time-based auto-commit feature instead. The issues of
discoverability and aborting changes that I raised were dismissed with that the
dialogs have cancel buttons and that the tools on other operating systems also
use timeouts. Let's see how this will work out.

Thirdly, it [wasn't obvious that the resolution scales have increments that
snap](https://github.com/libratbag/piper/issues/68). Due to the rather large DPI
range of 50 to 12000 (inclusive), the increments of 50 are so small that the
snapping is barely noticeable. We're discussing right now whether a DPI of 12000
is even realistic; if we limit the DPI to a reasonable range of say 50 - 6000
and use steps of 100 things should already be a little better. I suppose this
will simply be a case of trying different ranges and step sizes, and then seeing
if people complain about the limited range.

Furthermore, an interesting issue was raised: instead of having leader lines
next to the device SVG (see parts [4](/blog/gsoc-part-4) and
[6](/blog/gsoc-part-6)), the keys themselves in the SVG could be clickable. This
should be doable, but Jakub Steiner, my mentor and I also discussed a
<q>capture</q> mode where Piper grabs the mouse and listens for key presses to
open that key's configuration. This is an open question still, but definitely
interesting to think about!

Furthermore, [libratbag needs to return sane defaults for settings that are
currently not enabled](https://github.com/libratbag/libratbag/issues/270), [the
resolution scale can be hidden at the end of the
list](https://github.com/libratbag/piper/issues/74), [the button map dialog
needs a search field](https://github.com/libratbag/piper/issues/77) because the
list is too long, [profile cycle buttons need to apply across all
profiles](https://github.com/libratbag/piper/issues/78) to prevent landing in a
profile with no way out when using said button, [the active resolution needs to
be highlighted in the list](https://github.com/libratbag/piper/issues/80),
[changing a resolution should make that resolution the active
one](https://github.com/libratbag/piper/issues/81) so that the user can see the
effects automatically, [Piper shouldn't allow unsetting the left mouse
button](https://github.com/libratbag/piper/issues/82) because we don't want the
user to end up without one, [keyboard support should be
improved](https://github.com/libratbag/piper/issues/83), [Piper should allow the
user to set profile names](https://github.com/libratbag/piper/issues/85) and
Piper should handle [device
disconnects](https://github.com/libratbag/piper/issues/89) and [newly connected
devices](https://github.com/libratbag/piper/issues/90).

As you can see, there's plenty left to do the coming weeks! As my British
classmate says, *onwards and upwards*!

This blog post is part of a [series](/series/gsoc/). You can read the next part about the
finishing touches [here](/blog/gsoc-part-12) or the previous part about
finishing the button page [here](/blog/gsoc-part-10).
