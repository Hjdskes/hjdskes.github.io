+++
date = 2018-11-22T19:59:00+01:00
title = "Cage: the Wayland kiosk"
description = "Cage: the Wayland kiosk"
type = "Active"
+++

<img src="/img/projects/cage/cage.svg" alt="Cage's logo" width="140px" align="right">

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

Cage supports multiple outputs. It supports hotplugging additional outputs and
exits when its last output is removed. Cage defaults to the outputs' preferred
modes and supports (static, i.e. specified on startup) output rotation. Cage
does not support output layout configuration.

There is no support for virtual workspaces. Input-wise, Cage supports pointer
input, keyboard input and touch input. Copy and paste works as well, including
primary selection and with full XWayland support.

For more information, such as how install Cage, how to configure Cage and the
exact list of Wayland protocols supported by Cage, please see its [Wiki on
GitHub](https://github.com/Hjdskes/cage/wiki).

Cage is based on the annotated source of tinywl and rootston.

## Contributing

If a Wayland kiosk is something you’ve been waiting for, or if you want a
simple project to get your feet wet with wlroots and/or Wayland (or C, or open
source contributions, or ...), please feel free to jump in and help out! You
can take a look at the [open issues](https://github.com/Hjdskes/cage/issues) to
see what needs to be done. I can assist and/or mentor anyone willing to
contribute.

## Release signatures

Releases are signed with
[6EBC43B1](http://keys.gnupg.net/pks/lookup?op=vindex&fingerprint=on&search=0x37C445296EBC43B1)
and published on [GitHub](https://github.com/Hjdskes/cage/releases).

## Bugs

For any bug or feature request, please [create an
issue](https://github.com/Hjdskes/cage/issues/new) on
[GitHub](https://github.com/Hjdskes/cage).

## License

Please see [LICENSE](https://github.com/Hjdskes/cage/blob/master/LICENSE) on
[GitHub](https://github.com/Hjdskes/cage).

Copyright © 2018-2019 Jente Hidskes
[dev@hjdskes.nl](mailto:dev@hjdskes.nl).
