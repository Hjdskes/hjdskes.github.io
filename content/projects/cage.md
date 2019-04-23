+++
date = 2018-11-22T19:59:00+01:00
title = "Cage: the Wayland kiosk"
description = "Cage: the Wayland kiosk"
type = "Active"
+++

<img src="/img/projects/cage/cage.svg" alt="Cage's logo" width="18%" align="right">

Cage is a kiosk compositor for Wayland. A kiosk is a window manager (in the X11
world) or compositor (in the Wayland world) that is designed for a user
experience wherein user interaction and activities outside the scope of the
running application are prevented. That is, a kiosk compositor displays a
single maximized application at a time and prevents the user from interacting
with anything but this application.

As such, user input such as moving, resizing, minimizing and unmaximizing
windows is ignored. Cage supports dialogs, although they too cannot be resized
nor moved. Instead, dialogs are centered on the screen. Note that multiple
maximized windows are supported, but the user is not able to cycle between them.
That is, if Cage is launched with a terminal emulator and an application is
launched from this terminal emulator, that application is placed "on top" of the
terminal emulator and takes all input until it is closed. When this application
is closed, the terminal emulator becomes visible again.

Cage supports a single, static output. It does not support hotplugging
additional outputs and exits when its only output is removed. Cage defaults to
the output's preferred mode and supports (static, i.e. specific on startup)
output rotation.  Cage does not support virtual workspaces.  Input-wise, Cage
supports pointer input, keyboard input and touch input. Copy and paste works as
well, also into and out of XWayland. Primary selection is supported, too.

Other features of Cage are:

* Idle inhibit. This allows Cage to keep track of so-called inhibitors, which
  prevent idle behavior such as screen blanking or locking while for example a
  video is playing. Note that this requires a third party idle management daemon,
  such as [swayidle](https://github.com/swaywm/swayidle).

* Client side- and server side decorations. With GTK+ on Wayland, client side
  decorations are the norm. KDE (and sway), however, prefer server side
  decorations. On startup, Cage can be told to prefer (and communicate to
  supporting clients the use of) server side decorations. Note that decorations
  do not make sense for Cage (as user interaction isn’t supported per definition)
  and hence, Cage won’t draw any decorations when server side decorations are
  preferred.

* Damage tracking. With damage tracking, Cage only redraws the parts of the
  screen that changed. This makes Cage very resource- and power efficient.

There is no configuration for Cage. To start Cage, simply call its binary with
the path to the application you want to launch within the session. For example,
use `cage /usr/bin/epiphany` to launch Cage with the Epiphany web browser. When
the last application window is closed, Cage closes as well.

Cage does not support panels, virtual keyboards, screen capture, et cetera.  If
you have a good use case, I welcome pull requests implementing one of these
features or any other feature or Wayland protocol. Virtual keyboard support,
for example, is something I'm interesting in having added to Cage.

Cage is based on the annotated source of tinywl and rootston.

## Release signatures

Releases are signed with
[6EBC43B1](http://keys.gnupg.net/pks/lookup?op=vindex&fingerprint=on&search=0x37C445296EBC43B1)
and published on [GitHub](https://github.com/Hjdskes/cage/releases).

## Installation

For now you'll have to compile Cage from source. There is a pre-release, which
can you download from
[here](https://github.com/Hjdskes/cage/releases/tag/v0.1). This version
requires wlroots 0.5.0.  Alternatively, you can grab the latest master from
[GitHub](https://github.com/Hjdskes/cage). The git build should always be built
against the latest tag of wlroots.

You can build Cage with the [Meson](https://mesonbuild.com) build system.
Simply execute the following steps to build Cage:

```
$ meson build
$ ninja -C build
```

Cage comes with compile-time support for XWayland. To enable this, first make
sure that your version of wlroots is compiled with this option. Then, add
`-Dxwayland=true` to the `meson` command above. Note that you'll need to have
the XWayland binary installed on your system for this to work.

You can then run Cage by running `./build/cage /path/to/application
--with=arguments`. If you run Cage from within an existing X11 or Wayland
session, it will open in a virtual output as a window within your existing
session. If you run it from a TTY, it'll run with the KMS+DRM backend. In debug
mode (the default build type with Meson), press <kbd>Alt</kbd>+<kbd>Esc</kbd> to
quit. To build a release build, use `meson build --buildtype=release`.

## Running Cage with systemd

You might want to start Cage automatically on boot. I have written such a
service for my [home automation](/blog/home-automation) project. This service
logs in as the specified user after boot and then launches Cage with the
specified application. It sets up a full user session with logind and a custom
PAM stack.

You can find the systemd service
[here](https://github.com/Hjdskes/buildroot/blob/hjdskes/board/hjdskes/rpi3/rootfs_overlay/etc/systemd/system/cage%40.service).
When using it, be sure to change the user. You will also need to add the custom
[PAM](http://linux-pam.org/) stack found
[here](https://github.com/Hjdskes/buildroot/blob/hjdskes/board/hjdskes/rpi3/rootfs_overlay/etc/pam.d/cage).
This stack simply logs the user in with pam_unix and then launches a user
session with pam_systemd. Don't forget to enable the service and to change
systemd's default target to `graphical`!

## Contributing

If a Wayland kiosk is something you’ve been waiting for, or if you want a
simple project to get your feet wet with wlroots and/or Wayland (or C, or open
source contributions, or ...), please feel free to jump in and help out! You
can take a look at the [open issues](https://github.com/Hjdskes/cage/issues) to
see what needs to be done. I can assist and/or mentor anyone willing to
contribute.

## Bugs

For any bug or feature request, please [create an
issue](https://github.com/Hjdskes/cage/issues/new) on
[GitHub](https://github.com/Hjdskes/cage).

## License

Please see [LICENSE](https://github.com/Hjdskes/cage/blob/master/LICENSE) on
[GitHub](https://github.com/Hjdskes/cage).

Copyright © 2018-2019 Jente Hidskes
[hjdskes@gmail.com](mailto:hjdskes@gmail.com).
