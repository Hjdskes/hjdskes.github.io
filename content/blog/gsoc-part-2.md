+++
date = "2017-05-14T16:01:04+02:00"
title = "GSoC part 2: community bonding"
tags = [ "Piper", "libratbag", "ratbagd", "fdo", "Flatpak", "Meson", "udev" ]
categories = "Development"
series = "GSoC"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

Two weeks have now passed since my [introductory blog post](/blog/gsoc-part-1),
so as promised here is part two! The theme of this blog post is probably
something along the lines of <q>"preparation"</q>, as that is what I've been
doing mostly.

The period between that of announcing the accepted student proposals and phase
one is called the [community bonding period][bonding]. In this period students
are supposed to get to know their mentors, their organizations, familiarize
themselves with their projects (even more) and get everything ready to start
off the coding period on May 30th.

### Community bonding

My mentor gave me a list of IRC channels I could join and a list of mailing
lists I may want to subscribe to. I am now subcribed to four mailing lists and I
lurk/participate in five IRC channels. My blog has been added to [Planet
Freedesktop][planet.fdo]. I have also joined a GSoC '17 group on Telegram, where
currently over 600 students participate. Finally, I started watching all the
repositories under the [libratbag GitHub organisation][libratbag] so that I stay
up to date on any issues, pull requests and commits.

### Preparing the work on Piper

Probably the most important thing you can do during the community bonding period
is preparing your project. This does not just mean getting your development
environment setup; it also means that you should familiarize yourself with your
project and its dependencies and resolve any open issues that your project
depends on. In my case, there were a few such issues that I tackled.

Both libratbag and ratbagd recently switched to Meson. For ratbagd, this meant
that its DBus and systemd service files were not installed correctly
([#18][issue18]). This was fixed in [#20][issue20]. Ratbagd's README also had
not been updated to reflect Meson's way of configuring the build. I fixed this
in [#21][issue21] together with some formatting. Finally, I implemented
missing signals for both the `Profile` and `Resolution` DBus interfaces
([#22][issue22]). One pull request is still open, which implements a missing
method (including DBus signal) to set a default resolution ([#24][issue24]).

As for Piper itself, my mentor suggested I look into Flatpaks as an easy way of
deploying Piper for testing. In short, this turned out to be impossible for now
because Flatpaks cannot bundle udev. Here I paraphrase Alexander Larsson from
`#flatpak` on Freenode:

> You can bundle udev for the API but you can't rely on it *working*, because
a) it may not have access to every device, etc and b) it will not have access to
the system udevd database and we can't grant it because that is not a stable
on-disk format (I asked upstream about it).

Since libratbag and ratbagd rely on udev, a Flatpak will have to wait until a
solution to this issue has been found. Nonetheless, a Flatpak manifest remains
available in my [WIP branch][wip/flatpak] -- you just can't run it ;)

Whilst working on Flatpak'ing Piper, I got more and more convinced that Piper
should switch to [Meson][meson] as opposed to [setuptools][setuptools]. Meson
brings better integration with the GNOME stack through its GNOME module,
allowing us to use [GSettings][gsettings], [GResource][gresource] and other
technologies without having to add support for this to setuptools ourselves. I
have ported Piper and opened [#6][issue6] to get this implemented. This is the
first activity in Piper's repository since April 6 last year, so I guess it
officially starts GSoC for Piper!

This blog post is part of a series. You can read the previous part
[here](/blog/gsoc-part-1).

[bonding]: https://googlesummerofcode.blogspot.nl/2007/04/so-what-is-this-community-bonding-all.html)
[libratbag]: https://github.com/libratbag
[planet.fdo]: https://planet.freedesktop.org/
[ratbag]: https://github.com/libratbag/ratbagd
[issue18]: https://github.com/libratbag/ratbagd/issues/18
[issue20]: https://github.com/libratbag/ratbagd/pull/20
[issue21]: https://github.com/libratbag/ratbagd/pull/21
[issue22]: https://github.com/libratbag/ratbagd/pull/22
[issue24]: https://github.com/libratbag/ratbagd/pull/24
[wip/flatpak]: https://github.com/Hjdskes/piper/tree/wip/flatpak
[meson]: http://mesonbuild.com/
[setuptools]: https://packaging.python.org/installing/
[gsettings]: https://developer.gnome.org/gio/stable/GSettings.html
[gresource]: https://developer.gnome.org/gio/stable/GResource.html
[issue6]: https://github.com/libratbag/piper/pull/6

