+++
date = "2017-06-16T20:47:56+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "Inkscape", "mockup", "Gtk", "container" ]
title = "GSoC part 4: the first sprint"
categories = "Development"
series = "GSoC"
draft = true
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

This is going to be a long one, so grab a drink and a snack and buckle up!
Incidentally, the X.Org foundation has asked us, the 2017 GSoC students, to blog
weekly so from now on I will do so; which will also mean smaller blogs in the
future.

I made a schedule to go with my proposal in which I divided the coding period
into two week sprints to plan out my project. Since the coding period started on
a Tuesday (May 30), my sprints start on Tuesdays and end on Mondays. At the
moment, I am ahead of schedule and will likely adjust it -- if I do that, I'll
make sure to align sprint ends on Fridays so they align with my weekly updates.

Anyway, what have I done in the previous sprint? How nice of you to ask! Quite a
lot, actually (as I said, I'm ahead of schedule!).

### Updating the mockups

As you know if you've read the [previous blog post][previous], I began with
designing the new Piper and making mockups to demo these designs. Last week I
discussed these mockups with [Jakub Steiner][jakub], one of GNOME's designers.

Overall, Jakub thought the designs felt a lot like <q>engine tuning</q>, i.e.
specialized operations that you need specialist knowledge for and not something
you want to shove in front of every day users (while discussing this, he linked
me to [shit work][shit] as recommended reading). We agreed, however, that this
is probably OK considering that Piper is mostly targeted towards gamers or other
enthusiasts who deliberately buy a gaming mouse for these features, and are thus
expected to know how they work and what they can do.

After discussing that, Jakub had the following feedback on the mockups:

1. The <q>legend</q> approach (i.e. having an image with button labels, and
   having to search for those labels in an adjacent list to configure those
   buttons), is a nightmare (in fact, it reminded him of old school bus tables
   -- I wouldn't know how those looked, I'm from '94 &#128521;). As an
   alternative, he suggested that we introduce a <q>capture button</q> mode that
   allows the user to press a button on their physical device to highlight the
   button in the SVG and directly open the configuration dialog.  This is
   however not currently supported in libratbag, although in the future it may
   be. I plan on starting a discussion on this topic once libratbag and ratbagd
   [have been merged][merge], as this is the first step towards enabling this
   feature.  Until then, we went for a visual mapping of the buttons' locations,
   arranging the markings so that they directly associate to the assigned
   action.  When the action is hovered with the cursor, the button in the SVG is
   highlighted.
2. Profile management seems a little odd. It implies that you would switch
   profiles often, when instead they are a <q>set-and-forget</q> kind of thing.
   While true, Peter and I felt that they are already quite hidden away and
   decided to leave it as-is -- at least for the time being.
3. The general interface depends on having nice graphics for each device. To
   streamline the UI and be less dependent on good looking, functional
   illustrations, Jakub suggested we use toned down illustrations instead. He
   offered his help to make a bunch, and work is [in-progress][toned-down-svgs].

As an example, this is how the button assignment stack page will look now:

![Button assignment stack page](/img/blog/gsoc-part-4/buttons.png)

Much better! All the updated mockups can be seen on the [Redesign Wiki][wiki].

### A custom GTK container: MouseMap

### Importing ratbagd's bindings

ratbagd [dropped][dropped] its Python bindings, because <q>they were mostly
boilerplate and 1:1 mapping of the DBus interface anyway</q>. This was actually
good news for Piper, as we can now customize the bindings specifically to
Piper's needs. I [imported][import] the removed bindings and [updated][update]
them to reflect the current features of libratbag and ratbagd (for this,
[ratbagd][ratbagd-update] also had to be updated).

In the process I GObject-ified the bindings so that they inherit from GObject.
This allows us to emit GObject signals when we receive a signal over DBus and
expose the DBus interfaces' properties as GObject properties. The advantage of
this approach is that the Piper code can add signal handlers to these signals
using `Ratbagd*.connect("<signal>", <callback>)` which are called when the
signals are emitted, and watch for property changes  using
`Ratbagd*.connect("notify::<property>", <callback>)`.

### What's next?

The next item on the schedule is to reimplement Piper's main window following
the mockups. According to the schedule, this window should have the same
functionality as the current Piper. I now doubt this is a realistic goal,
because so much has changed from the current design. However, considering that
the MouseMap is almost done, I can definitely get a long way before this sprint
is over!

This blog post is part of a series. You can read the previous part about
designing and making the mockups [here][previous].

[previous]: /blog/gsoc-part-3
[jakub]: http://jimmac.musichall.cz/
[shit]: https://zachholman.com/posts/shit-work/
[merge]: https://github.com/libratbag/libratbag/issues/179
[toned-down-svgs]: https://github.com/libratbag/libratbag/pull/182
[wiki]: https://github.com/libratbag/piper/wiki/Piper-Redesign
[dropped]: https://github.com/libratbag/ratbagd/pull/27
[import]: https://github.com/libratbag/piper/pull/8
[update]: https://github.com/libratbag/piper/pull/10
[ratbagd-update]: https://github.com/libratbag/ratbagd/issues/29
