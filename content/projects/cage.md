+++
date = 2018-11-22T19:59:00+01:00
title = "Cage: the Wayland kiosk"
description = "Cage: the Wayland kiosk"
tags = ["wayland","compositor","cage","wlroots"]
categories = ["Projects","Development","Home automation"]
type = "Active"
+++

Cage is a kiosk compositor for Wayland. A kiosk is a window manager
(in the X11 world) or compositor (in the Wayland world) that is
designed for a user experience wherein user interaction and activities
outside the scope of the running application are prevented. That is, a
kiosk compositor runs a single, maximized application and prevents the
user from interacting with anything but this application.

As such, user input such as moving, resizing, minimizing and
unmaximizing windows is ignored. Cage supports dialogs, although they
too cannot be resized nor moved. Instead, dialogs are centered on the
screen.

Cage supports a single, static output. It does not support hotplugging
additional outputs and exits when its only output is removed. Cage
defaults to the output's preferred mode and does not support
rotation. Input-wise, Cage supports pointer input, keyboard input and
([soon](https://github.com/Hjdskes/cage/issues/1)) touch input. Copy
and paste works as well.

There is no configuration for Cage. To start Cage, simply call its
binary with the path to the application you want to launch within the
session. For example, use `cage /usr/bin/epiphany` to launch Cage with
the Epiphany web browser. When the application is closed, Cage closes
as well.

Cage does not support any Wayland protocols other than xdg-shell. That
is, there is no support for panels, virtual keyboards, screen capture,
primary selection, et cetera. Cage fulfills my needs in its current
state (well, [almost](https://github.com/Hjdskes/cage/issues)), but I
welcome pull requests implementing one of the features listed. The
layer-shell protocol especially might make for a cleaner
implementation and virtual keyboard support is something that I might
want to add later too, depending on how my needs grow.

Cage is based on the annotated source of
[TinyWL](https://gist.github.com/ddevault/ae4d1cdcca97ffeb2c35f0878d75dc17).

## Installation

For now you'll have to compile Cage from source. There is no release
yet, so you'll have to grab the latest master from
[GitHub](https://github.com/Hjdskes/cage).

You can build Cage with the [Meson](https://mesonbuild.com) build
system. It requires [wlroots](https://github.com/swaywm/wlroots) (and
its dependencies wayland and xkbcommon) to be installed. Simply
execute the following steps to build Cage:

```
$ meson build
$ ninja -C build
```

You can then run Cage by running `./build/cage /path/to/application
--with=arguments`. If you run Cage from within an existing X11 or
Wayland session, it will open in a virtual output as a window within
your existing session. If you run it from a TTY, it'll run with the
KMS+DRM backend. In debug mode (the default build type with Meson),
press <kbd>Alt</kbd>+<kbd>Esc</kbd> to quit. To build a release build,
use `meson build --buildtype=release`.

## Running Cage with systemd

You might want to start Cage automatically on boot. I have written
such a service for my [home automation](/blog/home-automation)
project. This service logs in as the specified user after boot and
then launches Cage with the specified application. It sets up a full
user session with logind and a custom PAM stack.

You can find the systemd service
[here](https://github.com/Hjdskes/buildroot/blob/hjdskes/board/hjdskes/rpi3/rootfs_overlay/etc/systemd/system/cage%40.service). When
using it, be sure to change the user. You will also need to add the
custom [PAM](http://linux-pam.org/) stack found
[here](https://github.com/Hjdskes/buildroot/blob/hjdskes/board/hjdskes/rpi3/rootfs_overlay/etc/pam.d/cage). This
stack simply logs the user in with pam_unix and then launches a user
session with pam_systemd. Don't forget to enable the service and to
change systemd's default target to `graphical`!

## Bugs

For any bug or feature request, please [create an
issue](https://github.com/Hjdskes/cage/issues/new) on
[GitHub](https://github.com/Hjdskes/cage).

## License

Please see
[LICENSE](https://github.com/Hjdskes/cage/blob/master/LICENSE) on
[GitHub](https://github.com/Hjdskes/cage).

Copyright © 2018 Jente Hidskes
[hjdskes@gmail.com](mailto:hjdskes@gmail.com).
