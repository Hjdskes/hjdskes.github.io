+++
date = 2018-12-27T17:31:12+01:00
title = "Announcing Cage: the Wayland kiosk"
description = "Cage: the Wayland kiosk"
tags = ["wayland","compositor","cage","kiosk","wlroots"]
categories = ["Projects","Home automation"]
+++

Yesterday I made [Cage](https://github.com/Hjdskes/cage) publically
available. Cage is a kiosk for Wayland. A kiosk is designed for
running a single, maximized application and preventing the user from
interacting with any other part of the system. You can read more about
Cage on its [project page](/projects/cage).

I developed Cage as part of my [home
automation](/blog/home-automation) project. This is a hobby and
learning project where I build my own, well, home automation system
(from scratch, i.e., I also developed a [purpose-built Linux-based
operating system](/projects/rpi-linux)). Home automation is an
excellent learning project, as it encompasses so much different
technologies both high- and low-level, especially if you go as far as
I did. In any case, I envision this system to run a single application
that then allows you to control your home. This is where the idea of a
kiosk came in.

As I want this to be a modern system and learn new Linux technologies,
I wanted to use a Wayland compositor. There is no existing kiosk
solution available, and although I could use
e.g. [sway](https://swaywm.org/) and configure that, I went with the
learning and do-it-myself approach. I have developed X11 window
managers before but had never touched a Wayland compositor. Also, I
want to "do it right"™ and don't want to lock something down and
inevitably risk there is a way out after all, even if this is in the
friendly environment of my own appartment.

Cage isn't done yet; my Raspberry Pi (that runs the whole system) is
connected to the official 7" touch screen, but Cage does not yet
support touch input. There are also some things to refine, such as not
displaying a cursor if there is no pointer and to darken the primary
window when a dialog is open. I also want to optimize the power usage
by implementing damage tracking and activity tracking to turn the
screen off automatically after inactivity. All of these features are
provided by wlroots, it's simply a matter of building it into Cage.

If a Wayland kiosk is something you've been waiting for, or if you
want a simple project to get your feet wet with wlroots and/or
Wayland, please feel free to jump in and help out!

For questions, comments or feedback you can reach me on
[Twitter](https://twitter.com/Hjdskes),
[GitHub](https://github.com/Hjdskes) or
[email](mailto:hjdskes@gmail.com).

