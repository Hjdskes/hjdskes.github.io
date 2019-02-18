+++
date = 2018-12-27T16:54:01+01:00
title = "A purpose-built Linux OS for my Raspberry Pi 3B+ home automation system"
description = "A minimal Linux OS for my home automation system"
type = "Active"
+++

For my [home automation system](/blog/home-automation) I developed a
purpose-built (minimal, embedded) Linux-based operating system.

This embedded Linux distribution is built using
[Buildroot](https://buildroot.org/). To house my configuration, I
forked [Buildroot on
GitHub](https://github.com/Hjdskes/buildroot/tree/hjdskes). I added a
custom defconfig (`configs/hjdskes_rpi3_defconfig`) that holds my
image's configuration, and there is a subdirectory in
`board/hjdskes/rpi3/` to hold configuration files and a rootsfs
overlay.

The system is very minimal and modern: on top of the Linux kernel, it
installs systemd (only the required parts and `logind`), util-linux'
`agetty` and `login`, bash, Raspberry Pi firmware, `wpa_supplicant`,
mesa (Gallium VC4 driver, OpenGL ES and EGL), GTK+ 3, my Wayland
compositor [Cage](/projects/cage), the Cantarell font and the Adwaita
icon theme. Of course this also includes these packages' dependencies,
but with the finished filesystem using only 155 MB I think this
qualifies as a minimal system. I do still have to develop the actual
home automation application, which will add a few more dependencies to
the system.

Cage is started automatically on boot. I have [written a systemd
service](https://github.com/Hjdskes/buildroot/blob/hjdskes/board/hjdskes/rpi3/rootfs_overlay/etc/systemd/system/cage%40.service)
for this, which logs in as the specified user after boot and then
launches Cage. This systemd service does things the proper way, after
[this discussion on
wayland-devel](https://lists.freedesktop.org/archives/wayland-devel/2017-November/035973.html).
That is, it sets up a full user session with logind and a [custom PAM
stack](https://github.com/Hjdskes/buildroot/blob/hjdskes/board/hjdskes/rpi3/rootfs_overlay/etc/pam.d/cage).
This stack does the usual login handling through pam_unix and then
launches a user session with pam_systemd.
