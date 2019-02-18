+++
date = "2017-08-23T16:19:04+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "submission" ]
title = "GSoC part 15: submission"
categories = ["Projects"]
series = "Google Summer of Code"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

This is the last entry in the Google Summer of Code [series](/series/google-summer-of-code/) that
I have been writing weekly for the last three months. It is different from the
usual updates in that I won't be discussing development progress: rather, this
will be the submission report for the project as a whole. I'll be discussing the
[<q>why?</q>](#why) behind the project, the [plan](#the-plan) that my mentor and
I came up with to execute the project, the work I have done over the summer
including a video of the [result](#result), the things that are
[left](#what-s-left) to work on, what I've [learned](#what-i've-learned) during
the project and finally, the [links to the code](#code-submission) that I have
written for the actual submission. Of course I finish with a
[thank-you](#thanks). Enjoy!

For the uninitiated, my mentor is Peter Hutterer and the project was done under
the X.Org organization.

## Why

So why did Peter and I propose this project? Well, it was Google Summer of
Code, I wanted to gain experience in the real world and Peter wanted free
labor so he didn't have to do it &#128521;

Before the Summer of Code, Piper wasn't user-friendly, feature complete or even
actively developed in the first place. When Peter and Benjamin (bentiss)
[started](https://who-t.blogspot.nl/2015/09/libratbag-library-for-configurable-mice_16.html)
the libratbag project in September 2015, they had a clear idea for the library
itself but not its integration with the desktop:

> Eventually we want this to be integrated into the desktop environments, either
> in the respective control panels or in a standalone application. libratbag
> already provides SVGs for some devices we support but we'll need some designer
> input for the actual application. Again, any help you want to provide here
> will be much appreciated.

Help never arrived, and so in February 2016 Peter started himself. He threw
something together over the course of two months and released Piper version
0.2.1. It wasn't yet feature complete and the UI was... well, let's just call it
not user friendly. Piper wasn't touched since that release, even though
libratbag was steadily improving as was the gaming on Linux story in general.

This is why Peter and I proposed this project: to rewrite Piper from the
ground up so that it can fully expose all features offered by libratbag and
present a unified graphical user interface to those that want to configure their
gaming mice on their Linux desktop. <span style="font-size:xx-small">(*something
something year of the Linux desktop.*)</span>

## The plan

The goal thus was to rewrite Piper in order to make it more user-friendly and to
enable support for features found in today's gaming mice. This support was
already present in libratbag, the library created specifically to configure
gaming mice. In particular, libratbag allows you to:

1. configure your device's resolutions, through:
  1. adding and removing resolutions;
  2. switching between resolutions;
  3. setting a resolution's DPI and report rate;
  4. setting the active and default resolutions.
2. configure your device's buttons, through:
  1. remapping a physical button to another logical button;
  2. assigning special actions such as switching resolutions to physical
     buttons;
  3. assigning macros to physical buttons.
3. configure your device's LEDs through different effect modes, each with their
   own settings such as color, brightness and effect rate.
4. do all of the above as part of a profile, through adding and removing
   profiles.

In order to make Piper the best tool for the job, it had to be able to do all of
this as well. With this, the requirements of my project were established.
Initially I dedicated sprint one to requirement analysis, <!--This part I
initially wrote up as sprint one of my tentative plan,--> but I finished it even
before the coding period began (what can I say, I was excited!). This tentative
plan divided the work into mostly two week sprints, where each sprint would
result in a deliverable. All deliberables were required for a successful
completion of my project:

<!--Piper communicates with libratbag over a
[DBus](https://www.freedesktop.org/wiki/Software/dbus/) API exposed by a system
daemon called ratbagd.-->
<table>
  <thead>
    <tr>
      <th style="width:10px;text-align:center">Week</th>
      <th style="width:150px;text-align:center">Start / End date</th>
      <th style="width:150px;text-align:center">Milestone</th>
      <th style="width:200px">Explanation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center">1-2</td>
      <td style="text-align:center">30-5 / 12-6</td>
      <td>Identify the feature set to be supported in the GUI</td>
      <td>This includes looking what features most gaming mice provide and considering if they can be supported with libratbag/ratbagd. Perhaps support can be added for missing features.</td>
    </tr>
    <tr>
      <td style="text-align:center">3-4</td>
      <td style="text-align:center">13-6 / 10-7</td>
      <td>Start with the GUI</td>
      <td>Draft a mockup and discuss with  my mentor and GNOME’s design team if possible. Implement all features currently  supported by Piper.</td>
    </tr>
    <tr>
      <td style="text-align:center">5-6</td>
      <td style="text-align:center">27-6 / 10-7</td>
      <td>Enable the infrastructure to make a GUI possible</td>
      <td>Ratbagd has to be evaluated and maybe extended in order to support the new GUI with more features. This can likely be started in parallel to the previous deliverable while I wait for feedback on the mockup.</td>
    </tr>
    <tr>
      <td style="text-align:center">7</td>
      <td style="text-align:center">11-7 / 17-7</td>
      <td>Implement profiles and profile switching</td>
      <td>Allow the user to save the current settings as a profile that can be restored later.</td>
    </tr>
    <tr>
      <td style="text-align:center">8</td>
      <td style="text-align:center">18-7 / 24-7</td>
      <td>Enable resolution configuration</td>
      <td>Expose the resolution of the mice as a configurable setting.</td>
    </tr>
    <tr>
      <td style="text-align:center">9-10</td>
      <td style="text-align:center">25-7 /  7-8</td>
      <td>Implement LED configuration</td>
      <td>Currently not supported; allow the user to configure the mice’s LEDs.</td>
    </tr>
    <tr>
      <td style="text-align:center">10-11</td>
      <td style="text-align:center">8-8 / 21-8</td>
      <td>Start implementing button mappings</td>
      <td>Allow the user to remap the mice’s buttons to user-set functions. Start off by moving interfaces around to support this feature and starting on the implementation.</td>
    </tr>
    <tr>
      <td style="text-align:center">11-12</td>
      <td style="text-align:center">22-8 / 28-8</td>
      <td>Finish implementing button mappings</td>
      <td>The button mappings will be implemented to completion in these last two weeks.</td>
    </tr>
  </tbody>
</table>

## The work I did

If you've been following along with my weekly progress updates, you'll know that
I didn't exactly follow this schedule. As I already mentioned, the first sprint
was done even before it was supposed to start, while others took longer than
planned. I also moved some things around, as you will read below.

The biggest mistake I made in the schedule was to say that the rewrite would
support all features supported by the old Piper at the end of week four. I mean,
I had a whole sprint dedicated to bring support for, for example, resolutions,
so what was I even thinking here?

In any case, this is why I called it a *tentative* schedule. Luckily Peter
wasn't too strict on my schedule and was open to switching things around as I
went, which was a nice gesture that I took as a sign of trust in me getting
things done.

Let's run through each of the sprints, in the order of which I actually executed
them.

### Creating the mockups

Creating mockups of how the new user interface should look was the basis of my
project, together with establishing the feature set. I wasn't really looking
forward to this part, partly because I'd never made *real* mockups before but
also because I wasn't familiar with Inkscape, the tool I'd be using.

All of this was misplaced, as I quickly got the hang of it and was enjoying the
whole process! My process consisted of looking up concepts in GNOME's [Human
Interface Guidelines](https://developer.gnome.org/hig/stable/) and similar
mockups from the GNOME design team that are published [on a separate GitHub
account](https://github.com/gnome-design-team/gnome-mockups/). To save me some
time I mostly copied & pasted elements from their mockups into mine; taking the
concept of <q>standing on the shoulders of giants</q> quite literally!

To discuss the mockups, Peter created a [Redesign wiki
page](https://github.com/libratbag/piper/wiki/Piper-Redesign) where I'd publish
the mockups together with an explanation, on which Peter and I would
comment. In the process I commented out some comments to keep things clear for
myself, but if there's interest I can publish them again; all the data is still
there. Data for the Wiki, including history for the mockups, can be found in the
[`wiki` branch](https://github.com/libratbag/piper/tree/wiki).

After a few iterations, the mockups were ready according to Peter and I, at
which point I contacted GNOME's design team on `#gnome-design`.  To my surprise,
it was [Jakub Steiner](http://jimmac.musichall.cz/) who replied and gave his
feedback.  I won't discuss that feedback in detail here, because I [discussed it
at length in part 4](/blog/gsoc-part-4), but it was inspiring to talk with
someone of his status and I learned quite a bit from the conversations we had
(recommend reading: <q>[Shit
Work](https://zachholman.com/posts/shit-work/)</q>).

Probably the largest change that I made due to Jakub's feedback was to go from
a <q>legend</q> approach (i.e. having an image with labels and having to search
for those labels in an adjacent list to configure that object) to a visual
mapping approach, where a <q>map</q> of the device is displayed with lines
stretching from an object on the mouse to its corresponding control widget. To
visualize that, we went from

![The legend-based approach](/img/blog/gsoc-part-15/legend.png)

to

![The map-based approach](/img/blog/gsoc-part-15/map.png)

### Creating the MouseMap

A central element of the new mockups was thus this <q>map</q>: it was to be used
in all three configuration pages. As you can guess, there is no standard Gtk
widget to achieve this, so I had to write my own. This widget had to be able to
do the following:

1. Position child widgets on arbitrary x- and y-coordinates, relative to their
   markings in the SVG;
2. Draw the SVG in the background of the widget;
3. Update said SVG dynamically to highlight an element on the device when its
   corresponding control widget is hovered by the cursor.

I go in-depth into the creation of this custom container widget in [part
4](/blog/gsoc-part-4) of my development series. The creation of this widget
spanned a whole two and a half weeks, because of 1) my final university exams,
2) [optimizing the highlighting of the SVG elements](/blog/gsoc-part-5) and 3)
because, based on another discussion with Jakub, I also added support for
left-aligned widgets for devices that have too many buttons to position them all
on the right side. This required a significant rewrite of the layout code and
required updating all the SVGs we had as well. You can read all about that in
[part 6](/blog/gsoc-part-6/#adding-the-finishing-touches-to-the-mousemap).

### The resolutions page

With the MouseMap finished, it was time to get started on the real work. The
first step was to do the resolutions page, because this had the most support on
the ratbag side. This meant that I had to focus only on the Piper side of
things; something we didn't think would be the case for the buttons and the
LEDs.

This turned out to be a Good Thing™, because as I soon found out PyGObject [does
not support Gtk composite
templates](https://bugzilla.gnome.org/show_bug.cgi?id=701843). Such a template
allows you to define composite widgets (widgets composed of other widgets, e.g.
a window containing a few buttons) through `.ui` files, which are XML files
generated by [Glade](https://glade.gnome.org/). This removes all boilerplate
code to instantiate widgets, set their properties and connect their signals.

Luckily, there is an [unofficial
prototype](https://github.com/virtuald/pygi-composite-templates/) that brings
this to PyGObject. After an experiment and a short discussion with Peter, I
got the <q>all clear</q> signal to try this in Piper. To this day, I haven't
noticed a single issue yet and the UI code is significantly cleaner and easier
to understand.

With this out of the way I started on the resolutions page. I discuss all of
that (and the PyGI templates) in [part 7](/blog/gsoc-part-7).

### The LED page

Next up was the LED configuration page. I deviated from the original mockup
shown below:

![The LED page mockup](/img/blog/gsoc-part-15/leds.png)

This mockup uses multiple toggle buttons that are pressed to highlight the
current mode. One not-obvious interaction was that you'd have to click an
already pressed button to change the current mode, for example when you want to
change the solid mode's color. After a few iterations, I got it to what's there
now:

<video controls>
  <source src="/img/blog/gsoc-part-15/leds.webm" type="video/webm">
Your browser does not support the video tag.
</video>

The largest issue that I ran into here was a race condition where we'd set an
LED's mode on DBus, then query that mode on the same bus directly after that
without returning to the main loop to give our DBus proxy a chance to update.
You can read about this and other issues with ratbagd in [part
8](/blog/gsoc-part-8).

### The buttons page

When making the planning, Peter told me that the buttons would be the most
difficult part. He wasn't wrong, and I think overall I have spent most of my
time on the buttons.

The buttons page has been implemented according to the mockups, but these
intentionally left the configuration dialog empty. Too much was unclear to me
when I was designing the mockups, so I thought it'd be best to experiment and
iterate towards a final design once I got to this point.

At first I tried a dialog with a stack page for each kind of mapping. Ratbag
exposes four kinds of mappings, one of which [is to be
removed](https://github.com/libratbag/libratbag/issues/243):

1. Button mapping, where a physical button to another, logical button. This way
   you can for example make the right mouse button emit a left click;
2. Key mapping, where a physical button is assigned a series of keys to press
   and release on the keyboard;
3. Special mapping, where a physical button is assigned a special,
   device-specific function. Libratbag supports several such actions that are
   supported by most devices;
4. Macros, where a physical button is assigned a series of key events (presses
   with or without releases) and time intervals, to make a button emit a certain
   key combo with a certain interval in between.

The key mappings are to be removed because they are in essence a subset of
macros. The idea is to keep supporting them on the devices, but expose them as a
simple macro.

This first iteration looked like this:

![The first iteration of the button dialog](/img/blog/gsoc-part-9/first-iteration.png)

However, the different options are quite similar to the user: the general user
won't think of the (technical) difference between a button mapping and a special
mapping. Similarly, as explained, key mappings are just a subset of macros.
Because of this, I have iterated away from separating these mappings and
finalized on a single list with categories instead:

<video controls>
  <source src="/img/blog/gsoc-part-15/buttons.webm" type="video/webm">
Your browser does not support the video tag.
</video>

As you can see, we've also prevented users from shooting themselves in the foot
by remapping the left mouse click. The only valid scenario we could think of for
wanting to remap the primary mouse buttons was to switch them around for
left-handed users; if you want to remap them for another purpose, please [open
an issue](https://github.com/libratbag/piper/issues/new). If you are interested
in the technical details behind this configuration dialog, you can read [part
9](/blog/gsoc-part-9#technical-details) and [part
13](/blog/gsoc-part-13#preventing-the-user-from-shooting-themselves-in-the-foot).

### Profiles

I moved the profiles to the end of the summer (as opposed to the beginning
according to the schedule) because I wanted to have a solid architecture for the
rest of the code that I could then thread the profiles through; if I'd done
profiles first I would have been working in the dark, so to speak. I'm happy
with this decision and think it worked out well.

Supporting profiles means that all control widgets

1. update their state to reflect new values in the new profile. For example, a
   resolution scale displaying the first resolution’s DPI of 50 in one profile
   should, when the profile changes to another profile, display the first
   resolution's DPI of 100 in that profile (if the first resolution in that
   profile has a resolution of 100 of course, but bear with me here), and
2. apply their changes to the correct resolution object. Using the same example,
   the scale should now change the DPI of the first resolution in the *other*
   profile, and not the first resolution in the *original* profile.

Each control widget thus needs to be aware of profile changes so that it can
always <q>talk</q> with the active profile to do items one and two above. The
different approaches to do this throughout the architecture are discussed in
[part 11](/blog/gsoc-part-11). Once Peter and I settled on this,
implementing the code wasn't much work (which I took as a confirmation of both
the approach and shuffling plans around being the right choices).

### The welcome- and error screens

Both these features didn't appear in the original schedule, but were brought
forward by Peter as feedback on my mockups. He rightly said that Piper
should be able to deal with devices being unplugged or otherwise disconnecting,
and having zero or more than one devices connected. For these scenarios, I
designed the welcome- and error screens:

![The welcome screen](/img/blog/gsoc-part-15/welcome.png)

![The error screen](/img/blog/gsoc-part-15/welcome-no-devices.png)

I moved these to the end of the summer as, to me, they were the least essential
features to implement: having Piper deal with errors when it can't even
configure everything on your device is useless, and owning more than one device
(let alone using them simultaneously) is a niche case.

There was, however, another reason to implement these screens. Contrary to
initial plans, there [are ideas to support a subset of gaming
keyboards](https://github.com/libratbag/libratbag/issues/172) as well. This
wasn't part of my work, but naturally if I could make Piper open for extension
that was the way to go. In essence, this would then just be another such screen.

That means there would be four screens, each providing a different <q>view</q>
or *perspective* into the same application window. I therefore added the concept
of a <q>perspective</q>, which I define as a certain view into Piper. The
implementation details can be found in [part
11](/blog/gsoc-part-11#perspectives), but in short the window has a stack of
perspectives, one of which it activates depending on what happens. Adding
keyboard support is now as simple as adding a keyboard perspective that contains
all the necessary control widgets.

### Libratbag and ratbagd changes

Over the course of the summer there have also been substantial changes to
libratbag and ratbagd. The most visible change on the user-side is that
libratbag now supports SVG themes. This was done after my design discussions
with Jakub, where he suggested that Piper uses toned-down SVG's instead of the
colored SVGs that libratbag shipped until then. However, since Piper is a GUI
for libratbag intended to integrate with the GNOME Desktop Environment, it is
entirely possible that a hypothetical KDE version would want different graphics.
For this reason libratbag thus supports SVG themes, where currently a `default`
and a `gnome` theme are present.

A developer and packager-side change is the merging of ratbagd and libratbag
into a single project. Anything using libratbag needs to run as root to have
sufficient permissions to access the devices, at which point you'll need some
daemon to use it from any user-facing application, whether this be graphical or
command-line. At this point, you're going to need IPC between the daemon and its
client(s) and then you might as well merge the two projects.

Specifically to Piper, part of my contributions were adding missing bits to
ratbagd (an API for LEDs comes to mind) and fixing things that were broken in
one way or another. Peter went ahead and added support for macros specifically
because I required those bits in Piper, which otherwise might have been done
further down the line instead. Finally, the DBus interface was refactored
significantly to make most properties read-write instead of read-only with a
setter method. This was done not only to clean up the API but also to solve
issues in the bindings where the property would have to be updated in the DBus
proxy immediately in order to avoid race conditions.

## Result

Here's a short summary of what Piper can currently do:

<video controls>
  <source src="/img/blog/gsoc-part-15/overview.webm" type="video/webm">
Your browser does not support the video tag.
</video>

## What's left

As I mentioned in [part 11](/blog/gsoc-part-11), I finished all large features.
In the weeks after that, I also fixed (the most important) issues to improve the
user experience and Piper's robustness. All in all, I achieved what I set out to
do and all my code got merged. That doesn't mean, however, that there's nothing
left to do in both Piper and libratbag.

In the mockups, I showed the ability to add and remove resolutions. The control
widgets are there in Piper, but libratbag does not yet have this ability. This
means we'll have to implement this in the coming weeks and hook the widgets up
to the corresponding DBus calls to get this to work. Likewise, we also cannot
yet change the default resolution through Piper. There's been a [longstanding
PR](https://github.com/libratbag/piper/pull/36) that was recently closed in
order to start over. In short, there are issues with propagating this change
through ratbagd (more details are in [part
8](/blog/gsoc-part-8#setting-a-default-resolution)). However, recently I made
similar changes to ratbagd so I believe that this shouldn't be too difficult
anymore.

The report rate is currently part of the resolution, but not many devices
support this; it [should therefore be set per profile
instead](https://github.com/libratbag/libratbag/issues/202). In fact, Piper
already makes sure to synchronize a change in one resolution's report rate to
all resolutions part of the same profile.

We are also in the process of [making commits to the device
asynchronous](https://github.com/libratbag/piper/pull/158), so that we
circumvent the timout that would be reached on some devices. Furthermore, [the
initial window size is too big](https://github.com/libratbag/piper/issues/142),
[the device SVGs in the welcome screen need to be
aligned](https://github.com/libratbag/piper/issues/99), [the mousetrap picture
in the error screen should be
symbolic](https://github.com/libratbag/piper/issues/87), [the scale for the last
resolution's DPI can be masked in the
list](https://github.com/libratbag/piper/issues/74), [the scales need stops and
reasonable ranges](https://github.com/libratbag/piper/issues/68), [the macro
capture dialog should allow the user to capture
timeouts](https://github.com/libratbag/piper/issues/57) and finally, [the
<q>Off</q> page in the LED dialog needs an empty
placeholder](https://github.com/libratbag/piper/issues/45). Libratbag is also in
the process of adding support for [named
profiles](https://github.com/libratbag/libratbag/pull/275), after which [Piper
will do so too](https://github.com/libratbag/piper/issues/85). Libratbag also
[needs to report sane
defaults](https://github.com/libratbag/libratbag/issues/270), and finally,
libratbag's GNOME theme is still [lacking
SVGs](https://github.com/libratbag/libratbag/issues/213) for five currently
supported devices. I also want to get around to write some tests for Piper,
possibly using [dogtail](https://pypi.python.org/pypi/dogtail).

Those are all changes for the short term. In the long term, we are rethinking
the user experience yet again. When discussing my mockups with Jakub, he had
the idea that we could introduce a <q>capture button</q> phase, where you would
press the physical button on your device that you want to configure. This would
then be highlighted in the device SVG, and upon button release the respective
configuration dialog would open. Open questions for this design are:

1. How to initiate the capture phase;
2. How to present the current mappings and LED modes, and
3. How to configure LEDs and resolutions in this new form of interaction.

At GUADEC, Bastien Nocera [suggested a slightly different
alternative](https://github.com/libratbag/piper/issues/71), where we wouldn't
introduce a capture mode but rather make the different elements in the SVG
clickable. This would solve questions 1 and 3 of the capture-based approach, but
has the problem that it isn't yet clear how to make the SVG elements clickable.
I have some ideas, but I haven't experimented with this yet.

If you want to get involved, I have labelled some of the [open
issues](https://github.com/libratbag/piper/issues) with the labels <q>easy</q>
and <q>help wanted</q>! If you have questions, you can contact us on
`#libratbag` on Freenode, or on GitHub.

## What I've learned

I went into this project with some previous open source
[contributions](/contributions/) and experience with previous (university)
[projects](/projects/). Yet every project is different and every time I do one I
learn something new and improve myself as a developer. It's hard to compile a
list of things I've learned, as I picked up most things subconciously. Here's an
attempt, but it is very likely incomplete.

The most important skill I have picked up is working with people in different
timezones ([`"it's the middle of the night in Australia, you'll have to wait
until whot wakes up"`](https://youtu.be/Xv_VQJI7-UY?t=45)) and communicating
over IRC; especially being explicit in what you're saying.

Also new to me was interacting with different communities, where I have for
example had to consult GNOME's design team to discuss my mockups and the Gtk+
team when I had a Gtk-related issue. It was almost surreal to be talking with
these giants in the open source world, and to be given advice as <q>one of
them</q> was an experience in and off itself. Thanks to Jakub I have picked up
some pitfalls in UI design, and thanks to the Gtk+ guys I have deepened my
experience with Gtk+'s internals.

This project also exposed me to working with DBus and the
[Meson](http://mesonbuild.com) build system for the first time. It was also my
first Python project, as opposed to single file scripts.

Finally, I experienced debugging across multiple projects; sometimes I noticed a
bug in Piper, tracked it to and fixed it in either the bindings, ratbagd or
libratbag.

## Code submission

All of my code can be found in the master branch of [Piper's GitHub
repository](https://github.com/libratbag/piper). The commits between version
0.2.1 and 0.2.900 encompass my summer of code (until
`d2a94f833e0aec2bd74dfe94b439afe701212b13`), as announced on the [`input-tools`
mailing
list](https://lists.freedesktop.org/archives/input-tools/2017-August/001400.html).
You can also
[browse](https://github.com/libratbag/piper/commits/master?author=Hjdskes) the
commits online on GitHub.

I have also had to work on ratbagd and libratbag. The ratbagd project merged
with the libratbag project, but history was preserved when the repositories were
merged. All of my contributions to both projects are thus found in the master
branch on [libratbag's GitHub
repository](https://github.com/libratbag/libratbag). My commits are found in
version 0.9.900 (until `6ddba76c93e51c15acf6e59b316532a4332835ac`), as announced
on the [`input-tools` mailing
list](https://lists.freedesktop.org/archives/input-tools/2017-August/001399.html).
You can also
[browse](https://github.com/libratbag/libratbag/commits/master?author=Hjdskes)
the commits online on GitHub.

## Thanks

I would like to thank my mentor, Peter Hutterer, for offering me this
opportunity. It goes without saying (I'm doing it anyway!) that this was an
amazing experience that would not have been possible without Peter. I also want
to thank Benjamin for stepping in when Peter wasn't available, the X.Org
organisation for having us under their umbrella and the GNOME design and Gtk+
teams for their openness and advice. Finally, thank you Google for hosting the
summer of code!

This blog post marks the end of a
[series](/series/google-summer-of-code/). You can read the previous
part about the final changes [here](/blog/gsoc-part-14).
