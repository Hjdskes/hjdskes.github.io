+++
date = "2013-02-24T17:31:00+01:00"
title = "Gcolor3: a color selection dialog written in GTK+ 3"
type = "Active"
+++

{{< gallery "/img/projects/gcolor3/picker.png"
            "/img/projects/gcolor3/saved.png"
            "/img/projects/gcolor3/empty.png" >}}

Ever wanted to know the value of that color on your screen? Gcolor3
enables you to pick the color from any pixel on your screen. It also
offers a palette, so that you can easily mix and match a couple of
colors together.

When you have found the perfect combination of colors, naturally you
want to save them. Gcolor3 allows you to conveniently save and
retrieve colors.

[Gcolor3](https://gitlab.gnome.org/World/gcolor3) is a color selection
dialog written in [GTK+](http://www.gtk.org/) 3. It is much alike
[Gcolor2](http://gcolor2.sourceforge.net/), but uses the newer GTK+
version and other modernisations to better integrate into your modern
desktop.

{{% message type="warning" %}} Gcolor3 does not work on Wayland (see
issue [#38](https://gitlab.gnome.org/World/gcolor3/issues/38)). {{%
/message %}}

### Installation

There are three ways to install Gcolor3: you can either compile it
[from source](#compile-from-source), use a
[package](#distribution-packages) created for your Linux distribution,
or use the [Flatpak](#flatpak).

The most recent version of Gcolor3 is [version
2.3.1](https://gitlab.gnome.org/World/gcolor3/tags/v2.3.1), which
requires GTK+ 3.20. If your Linux distribution uses an older version,
please see the [older
releases](https://gitlab.gnome.org/World/gcolor3/tags).

#### Flatpak

{{% flathub title="Install Gcolor3 Flatpak" appstream-id="nl.hjdskes.gcolor3"%}}Install Gcolor3 from Flathub{{% /flathub %}}

To be able to install apps from Flathub you need to add the Flathub remote server:

```
$ flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

Now you can install Gcolor3 with the following command:

```
$ flatpak install flathub nl.hjdskes.gcolor3
```

To run Gcolor3, use:

```
$ flatpak run nl.hjdskes.gcolor3
```

#### Distribution packages

Gcolor3 is packaged for some Linux distributions:

* **Arch Linux:** Gcolor3 is packaged in `[community]`. There is an AUR package
  for the [git version](https://aur.archlinux.org/packages/gcolor3-git/).

* **Fedora:** There is a [copr
  repository](https://copr.fedorainfracloud.org/coprs/fnux/gcolor3/)
  to install Gcolor3. Please see the instructions there.

* **openSUSE:** There is an [openSUSE
  package](https://build.opensuse.org/package/show/home:sogal/gcolor3)
  available.

* **Ubuntu:** There is a
  [PPA](https://launchpad.net/~evertiro/+archive/ubuntu/gcolor3)
  available.

#### Compile from source

To compile Gcolor3, you need the GTK+ 3 development packages and your
Linux distribution's package containing the tools to compile packages.

You can download the tarball from the [current stable
release](https://gitlab.gnome.org/World/gcolor3/tags/v2.3.1), or pull
the latest changes from [git](https://gitlab.gnome.org/World/gcolor3).

When the build- and runtime dependencies of Gcolor3 have been
installed, run the following commands to build and install Gcolor3:

```sh
$ meson build
$ ninja -C build
# ninja -C build install
```

Optionally, the development packages can now be uninstalled.

### Bugs
For any bug or feature request, please [create an
issue](https://gitlab.gnome.org/World/gcolor3/issues/new?issue%5Bassignee_id%5D=&issue%5Bmilestone_id%5D=)
on GitLab.

