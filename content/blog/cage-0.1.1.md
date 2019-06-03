+++
date = 2019-06-03T20:12:29+02:00
title = "Cage 0.1.1 is out"
description = "A new release to build Cage with wlroots 0.6.0"
tags = ["wayland","compositor","cage","kiosk"]
categories = ["Projects"]
+++

Just a quick notification to anyone following this website for Cage updates: I
just released Cage 0.1.1. This release serves mostly for packagers that want to
package Cage with wlroots 0.6.0, such as the Arch Linux packagers.

As such, not too much has changed between 0.1 and 0.1.1:

1. Cage now drops root on startup on systems without (e)logind support (such as
   FreeBSD).
2. The `XKB_*` environment variables can now be used to configure keyboard
   devices.
3. Cage's damage tracking implementation has been optimized in order to submit
   less damage, resulting in less resource usage and smoother operation.
4. Cage will now attempt to use the monitor's preferred mode (if advertised).
   Otherwise, it will fall back to the last listed mode, which is usually the
preferred one.

Even though this minor release contains only 13 commits, those commits are made
by 4 authors and even more users have reported issues.  Between 0.1 and 0.1.1
Cage has been starred 68 times, bringing the total to 153.  For a niche project
as Cage, these numbers show a healthy community interest, for which I am
thankful!

The signed release
([6EBC43B1](http://keys.gnupg.net/pks/lookup?op=vindex&fingerprint=on&search=0x37C445296EBC43B1))
is available on [GitHub](https://github.com/Hjdskes/cage/releases/tag/v0.1.1).
Compile this version of Cage against wlroots 0.6.0.

For the path to 1.0, please see [the previous release announcement](/blog/cage-01). As always, if you want to help out with the development of Cage, please feel free to reach out! I can assist (and/or mentor) anyone willing to contribute.

For questions, comments or feedback you can reach me on
[Twitter](https://twitter.com/Hjdskes), [GitHub](https://github.com/Hjdskes) or
[email](mailto:hjdskes@gmail.com).
