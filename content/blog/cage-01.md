+++
date = 2019-04-23T20:24:11+01:00
title = "The first pre-release of Cage"
description = "The first release towards a stable Wayland kiosk"
tags = ["wayland","compositor","cage","kiosk"]
categories = ["Projects"]
+++

<img src="/img/projects/cage/cage.svg" alt="Cage's logo" width="15%" align="right">

Almost exactly four months ago I announced Cage, my Wayland compositor for a
kiosk-like environment. To the uninitiated: a kiosk is designed for running a
single, maximized application and preventing the user from interacting with any
other part of the system. You've probably seen many in your life in malls,
stores or even the dentist (*<q>how satisfied are you with your service?</q>*).
Kiosks can also be used for much cooler things, though, [such as running home
automation systems](/blog/home-automation/).

Since Cage's announcement, the project was noticed by
[Phoronix](https://www.phoronix.com/scan.php?page=news_item&px=Cage-Wayland-Compositor)
and other websites. Users found their way and Cage quite quickly picked up some
momentum.  It has grown from just a hobby project for myself into a Wayland
compositor with actual users. A small deviation but fun fact is that developing
Cage has lead me to find bugs in several layers of the stack and applications,
such as [Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1523889) and
[Mesa](https://bugs.freedesktop.org/show_bug.cgi?id=110479).

As a result of this interest, the project has grown in scope significantly.
Some of the new features are suggested by users and are clever use-cases that I
had never anticipated or even imagined. For example, [Drew
DeVault](https://drewdevault.com/), known for starting the
[sway](https://swaywm.org) and [wlroots](https://github.com/swaywm/wlroots)
projects and other ambitious endeavors, is working on mimicking a Plan9 rio
experience with Cage or using it as a "portal" to a [remote sway
session](https://drewdevault.com/2019/04/23/Using-cage-for-a-seamless-RDP-Wayland-desktop.html).
Other features, such as XWayland, are accommodating Cage to the larger audience
by providing a better and more smooth experience.

In this pre-release, Cage comes with support for:

* XDG Shell. This protocol describes behavior you'd typically expect in a
  graphical desktop session. For example, it describes how to manipulate
  (minimize, maximize, fullscreen) windows. Naturally, Cage ignores some of these
  events and only implements this protocol to the extent necessary for a kiosk.

* XWayland. This allows you to run X clients under Wayland. Obviously,
  applications are encouraged to upgrade and users are encouraged to use
  xdg-shell where possible, but in the case where migration is in-progress (e.g.
  Google Chrome), XWayland can help out.  This is a compile-time feature: Cage
  can run without presence of any X11 libraries.
  
* Mouse-, keyboard- and touch input. These should speak for themselves. A nice
  touch (pun not intended 😉) is that the cursor is hidden in case there is a
  touchscreen without a mouse.

* Idle inhibit. This allows Cage to keep track of so-called inhibitors, which
  prevent idle behavior such as screen blanking or locking while for example a
  video is playing. Note that this requires a third party idle management daemon,
  such as [swayidle](https://github.com/swaywm/swayidle). 

* Server side decorations. With GTK+ on Wayland, client side decorations are
  the norm. KDE (and sway), however, prefer server side decorations. With the
  implementation of the (new) xdg-server-decoration and (obsolete)
  server-decoration protocols, Cage supports both client side- and server side
  decorations. You can tell Cage to prefer (and communicate to supporting clients
  the use of) server side decorations by using the `-f` flag. Note that
  decorations do not make sense for Cage (as user interaction isn't supported per
  definition) and hence, Cage won't draw any decorations when server side
  decorations are preferred.

* Copy and paste (also into and out of XWayland). This should also speak for
  itself. Primary selection is also included!

* Damage tracking. With damage tracking, Cage only redraws the parts of the
  screen that changed.  This makes Cage very resource- and power efficient.
 
* Multiple, maximized applications in contrast to a single maximized
  application. When I first announced Cage, I planned on supporting only a
  single application window.  However, due to feature requests, I changed my
  mind and Cage now supports multiple maximized and overlapping windows. That
  is, if Cage is launched with a terminal emulator and an application is launched
  from this terminal emulator, that application is placed “on top” of the
  terminal emulator and takes all input until it is closed. When this application
  is closed, the terminal emulator becomes visible again. Note that cycling
  between multiple windows is not possible. 

* Output rotation. Thanks to [Tristan Daniel](https://github.com/tdaniel22),
  Cage now supports the rotation of outputs. Because of Cage's nature, this is
  "static", i.e., output rotation is set on startup with the `-r` flag.
  Specifying this flag multiple times results in multiple rotations of 90
  degrees.

* Last but not least, Cage now also has a logo! It is displayed in all its
  glory in the top right corner of this post. 

In this release, there are 155 commits from 3 different authors. Issues have
been reported by 9 users and Cage has been starred on GitHub 85 times. The
signed release
([6EBC43B1](http://keys.gnupg.net/pks/lookup?op=vindex&fingerprint=on&search=0x37C445296EBC43B1))
is available on [GitHub](https://github.com/Hjdskes/cage/releases/tag/v0.1).
Compile this version of Cage against wlroots 0.5.0.

The path to 1.0 is clear: I have tagged some issues on GitHub that I'd like to
make it in 1.0. You can browse them in the
[milestone](https://github.com/Hjdskes/cage/milestone/2) I created to track the
progress. I think all of these features are critical for a stable release. It
would be nice if we could get virtual keyboard support in as well, but I don't
want to block 1.0 on this as there is still work going on regarding this in
Wayland. The only other issues are those regarding animations and effects.
Likewise, this kind of eye candy isn't critical and I don't want to delay a
stable release on it, as I expect it to be quite a lot of work.

As always, if you think you can help out with any of these issues (whether
they're tagged for 1.0 or not), please feel free to reach out! I can assist
(and/or mentor) anyone willing to contribute.

For questions, comments or feedback you can reach me on
[Twitter](https://twitter.com/Hjdskes), [GitHub](https://github.com/Hjdskes) or
[email](mailto:hjdskes@gmail.com).

