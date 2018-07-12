+++
date = "2017-08-18T19:47:27+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "style context", "loop" ]
title = "GSoC part 13: I solved global warming!"
categories = "Development"
series = "Google Summer of Code"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

This week I have been solving more issues to make sure that Piper offers a
pleasent user experience, doesn't crash and runs smoothly. My mentor and
cvuchener from the libratbag project have been testing Piper the last week, and
together with a handful of users attracted to Piper they have opened a bunch of
issues for me to solve. Let's run through the most visible ones!

### Solving global warming

Probably the most fun issue to resolve this week was the one reported by my
mentor: [Piper contributes to global
warming](https://github.com/libratbag/piper/issues/133) (<q>you won't believe
what happened next!</q>). The issue here was that when the MouseMap is partially
or fully obscured by another window, Piper's CPU usage would touch the 100% and
hence, contribute to global warming. Since global warming is bad (and yes, it
*is* real &#128521;), obviously I had to fix it.

The report already contained a hint as to what was happening: the MouseMap's
`do_draw` method was being called *a lot* (with some imprecise measurements, I
got it to roughly every 30 milliseconds). Through some more debugging I found
that the issue went away if we didn't retrieve the theme's color for links from
the MouseMap's
[`StyleContext`](https://lazka.github.io/pgi-docs/Gtk-3.0/classes/StyleContext.html).
Gtk's baedert on `gtk+` linked me to [this old bug
report](https://bugzilla.gnome.org/show_bug.cgi?id=760462) that explains what's
going on. What follows here is my summary of the [linked blog
post](https://blogs.gnome.org/mclasen/2015/11/20/a-gtk-update/), that goes into
more detail than the bug report:

Since Gtk 3.18, passing a state other than the current state to
`Gtk.StyleContext::get_color` isn't recommended and can, apparently, lead to
hogging the CPU due to triggering a loop: requesting the style context's color
triggers a pixel cache refresh, which triggers `do_draw`, which requests the
style context's color, et cetera.

The fix, then, is straightforward: save and restore the style context around
requesting a color, so that it won't be invalidated and won't trigger a pixel
cache refresh. Indeed, this is the suggested (temporary) workaround given in the
linked blog post; the given permanent solution is to use the `gtk_render_*` API.
However, this doesn't apply for the MouseMap and as such, I [used the
workaround](https://github.com/libratbag/piper/pull/135/files) to do my share of
saving the planet.

### Preventing the user from shooting themselves in the foot

During GUADEC my mentor opened the issue that [we shouldn't allow a user to
unset the left mouse button](https://github.com/libratbag/piper/issues/82),
because if they do without mapping another button to a left mouse click they
won't have a left mouse click anymore and that's... well, troublesome to say the
least. The only question was how to best do this: randomly mapping
another button to a left mouse click was undesirable (for obvious reasons) but
we also shouldn't outright disallow remapping the (physical) left mouse button
as there are perfectly valid scenarios to do so. Think, for example, of left
handed users (yours truly) that swap the left- and right mouse buttons to use
the mouse with their left hand (not yours truly).

My first attempt then was to pop up a dialog that asks the user if they know
what they're doing *when we detect there isn't another button mapped to a left
mouse click* when they are attempting to remap the only/last button that is
mapped to a left mouse click (savvy?). I suppressed the voice in my head that
says dialogs are invasive and should be avoided, because I thought this was a
good compromise between protecting the user while still giving them all the
options. (As a sidenote, an undo button wouldn't work either because when the
last left mouse click has been unmapped, there is no left mouse click to press
undo with anymore).

I quickly implemented a [proof of
concept](https://github.com/libratbag/piper/pull/113), but my mentor was
stronger than I was and didn't give in to the dialog. Instead, he said we should
for now **only** allow to swap the left- and right mouse buttons; we'll hear it
from the users when they want more options. After two design iterations, this is
what I've settled on:

<video controls>
  <source src="/img/blog/gsoc-part-13/swap.webm" type="video/webm">
Your browser does not support the video tag.
</video>

The relevant pull requests are
[#117](https://github.com/libratbag/piper/pull/117) for the initial
implementation and [#143](https://github.com/libratbag/piper/pull/143)
(unmerged) for the UI rework.

Another way to shoot yourself in the foot is by assigning a button in one
profile to cycle through profiles but not in another: eventually, you'll get
stuck in that profile with no way out but to open Piper. In the heat of battle
where either it's you or them, obviously you don't want this to happen. This is
exactly why my mentor [reported this
issue](https://github.com/libratbag/piper/issues/78), again over GUADEC, and,
[as of last week](https://github.com/libratbag/piper/pull/112), this won't
happen and Piper is just that bit smarter!

### Preventing Piper from crashing

Libratbag contributor cvuchener reported [a bunch of
issues](https://github.com/libratbag/piper/issues?q=is%3Aissue+author%3Acvuchener)
last week, in all of which Piper was crashing.

First of all, [Piper was crashing when opening devices with weird
profiles](https://github.com/libratbag/piper/issues/120):

1. A profile containing an unsupported special button mapping crashed Piper, and
2. A device with profiles that did not have an active resolution set.

With Piper being a graphical user interface to libratbag it naturally cannot
support anything that libratbag doesn't, but it also shouldn't crash when it
*does* see something that isn't supported. In this case, the solution is to
recognize that there *are* unsupported actions and to simply [add the
`RatbagdButton.ACTION_SPECIAL_UNKNOWN` entry to the
map](https://github.com/libratbag/piper/pull/121) in the bindings that maps
special button mappings to their human readable representation.

While testing this, my device suddenly got a special button mapping with value
4294967295 (you'll have to take my word for this value not having any
significance within libratbag). As it turns out, libratbag (or ratbagd) doesn't
perform a range check and can thus let arbitrary special button mappings go
through instead of setting or returning `RatbagdButton.ACTION_SPECIAL_UNKNOWN`
for all unknown values. This can be solved in Piper by catching any `KeyError`s
when looking up a mapping's human readable representation, but it's better to
fix this in libratbag itself; which is why I opened [this
issue](https://github.com/libratbag/libratbag/issues/281).

As for the second crash mentioned above, apparently there are some misconfigured
libratbag drivers that do not set an active resolution. In this case, Piper now
prints a message informing the user of a buggy driver and simply returns the
first resolution (or profile) it finds
([#122](https://github.com/libratbag/piper/pull/122)).

Cvuchener also found that the apply button was [switching state when going back
to and from the welcome screen](https://github.com/libratbag/piper/issues/123).
This was simply a case of me trying to be too smart for my own good, as you can
see [in the one line fix](https://github.com/libratbag/piper/pull/127).

I also [forgot to destroy old profiles when reusing the
MousePerspective](https://github.com/libratbag/piper/pull/126) which led to
[duplicate profile entries that crashed Piper when
clicked](https://github.com/libratbag/piper/issues/124).

Finally, cvuchener ran into timeouts when committing changes to his device,
which has been a reoccurring issue for myself as well. My mentor and I had
discussed async commits before, but [until libratbag supports
this](https://github.com/libratbag/libratbag/issues/269) there isn't much that
Piper can do. Deciding on a proper timeout is difficult, as we

1. do not know what happens when a user changes settings while old changes are
   being committed (so we should strive to make it as small as possible?), and
2. don't know what value will be long enough not to cause timeouts. This depends
   both on the device (including whether it's wireless or not, as for example my
   G403 wired does not lead to timeouts but wireless it does) and the box
   running Piper.

We assume that DBus will cache any changes for us, and indeed it seems to work
just fine, so as a stop-gap until we get async commits the [timeout is now 2
seconds instead of half a second](https://github.com/libratbag/piper/pull/129).

This week we've seen a bunch of users trying to run Piper. This is exciting
because it means we're doing work that people need! It is also good because they
run into issues that need fixing before we tag a release &#9786;

One such case is a user that [tried to run Piper with a too old Gtk
version](https://github.com/libratbag/piper/issues/111). This resulted in us
[adding a check to Piper for the required Gtk
version](https://github.com/libratbag/piper/pull/118). Next, when that user
upgraded his Gtk version, he made libratbag recognize his device but forgot to
supply libratbag with a device SVG. Piper should have displayed the error
perspective in such a scenario, but it turned out that we [cannot raise
exceptions from GObject
properties](https://github.com/libratbag/piper/pull/125). After making this a
<q>real</q> setter method, the error perspective is now presented as it should.

### Work-in-progress

I'm still working on a bunch of other issues that I can hopefully get merged
before the 21st of August, which marks the end of my Google Summer of Code. I
intend to keep working on Piper after the summer, but these are features I would
like to get in before we tag a release.

First, jimmac [requested](https://github.com/libratbag/piper/issues/77) a search
field for the button mapping dialog. Today I opened the [pull
request](https://github.com/libratbag/piper/pull/143) that adds this and makes
the dialog in general look just that bit nicer (compared with what I showed
[part 10](/blog/gsoc-part-10)):

<video controls>
  <source src="/img/blog/gsoc-part-13/search.webm" type="video/webm">
Your browser does not support the video tag.
</video>

Another GUADEC issue was to [highlight the active
resolution](https://github.com/libratbag/piper/issues/80) in the resolutions
page. This was a [straightforward
change](https://github.com/libratbag/piper/pull/132), after having fixing
ratbagd ([#284](https://github.com/libratbag/libratbag/pull/284)). Here you can
see it in action:

<video controls>
  <source src="/img/blog/gsoc-part-13/active-resolutions.webm" type="video/webm">
Your browser does not support the video tag.
</video>

As you can see, this activates the clicked resolution and thereby also fixes
[that issue](https://github.com/libratbag/piper/issues/81) (but ignores issue
[#72](https://github.com/libratbag/piper/issues/72)). This approach should also
work towards being able to display and set the default resolution, [a pull
request](https://github.com/libratbag/piper/pull/36) that has been WIP since
July 11.

Last, but definitely not least, is that Piper can now be
[translated](https://github.com/libratbag/piper/pull/137) into your native (or
not!) language! Here you can see Piper in Dutch:

<video controls>
  <source src="/img/blog/gsoc-part-13/piper-dutch.webm" type="video/webm">
Your browser does not support the video tag.
</video>

As you can see, not everything is translated yet. There is something weird going
on with all strings that are translated and retrieved from a map; I have yet to
figure this one out. We also cannot yet run with local translations: for now
you'll have to install Piper in order to test your translations. I also intend
to add more context for translators so it is easier to see how to translate some
strings, and I intend to get this merged only after all the UI work is done so
we are sure to catch all strings.

Barring any newly discovered crashes, there are only three more issues to solve
before my deadline: [a crash resulting from libratbag returning its error code
1001](https://github.com/libratbag/piper/issues/140), [correctly restoring the
macro preview label](https://github.com/libratbag/piper/issues/141) and [fixing
the initial window size](https://github.com/libratbag/piper/issues/142).

This blog post is part of a [series](/series/gsoc/). You can read the next part about the final
changes [here](/blog/gsoc-part-14) or the previous part about the finishing
touches [here](/blog/gsoc-part-12).
