+++
date = "2013-02-24T17:31:00+01:00"
title = "Gcolor3: a color selection dialog written in GTK+ 3"
+++

{{< gallery "/img/projects/gcolor3/picker.png"
            "/img/projects/gcolor3/saved.png"
            "/img/projects/gcolor3/empty.png" >}}

Ever wanted to know the value of that color on your screen? Gcolor3 enables you
to pick the color from any pixel on your screen. It also offers a palette, so
that you can easily mix and match a couple of colors together.

When you have found the perfect combination of colors, naturally you want to
save them. Gcolor3 allows you to conveniently save and retrieve colors.

[Gcolor3](https://github.com/Hjdskes/gcolor3) is a color selection dialog written
in [GTK+](http://www.gtk.org/) 3. It is much alike
[Gcolor2](http://gcolor2.sourceforge.net/), but uses the newer GTK+ version and
other modernisations to better integrate into your modern desktop.

{{% message type="warning" %}} Gcolor3 does not work on Wayland (see issue
[#38](https://github.com/Hjdskes/gcolor3/issues/38)). {{% /message %}}

### Installation

There are three ways to install Gcolor3: you can either compile it [from
source](#compile-from-source), use a [package](#distribution-packages) created
for your Linux distribution, or use the [Flatpak](#flatpak).

The most recent version of Gcolor3 is [version
2.3](https://github.com/Hjdskes/gcolor3/releases/latest), which
requires GTK+ 3.20. If your Linux distribution uses an older version,
please see the [older
releases](https://github.com/Hjdskes/gcolor3/releases).

#### Distribution packages

Gcolor3 is packaged for some Linux distributions:

* **Arch Linux:** There are AUR packages for the [latest stable
  release](https://aur.archlinux.org/packages/gcolor3/) and for the [git
  version](https://aur.archlinux.org/packages/gcolor3-git/).

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
release](https://github.com/Hjdskes/gcolor3/releases/latest), or pull
the latest changes from [git](https://github.com/Hjdskes/gcolor3).

When the build- and runtime dependencies of Gcolor3
have been installed, run the following commands to build and install
Gcolor3:

```sh
$ meson build
$ ninja -C build
# ninja -C build install
```

Optionally, the development packages can now be uninstalled.

### Translations

You can help translating Gcolor3 to your own language! Currently, Gcolor3 is
available in over 10 languages.

New translations are always welcome! To do so, simply follow these steps:

```sh
$ meson build
$ ninja -C build gcolor3-pot
$ mv po/Gcolor3.pot po/xx.po
```

Where `xx` is the code of your language (e.g. `nl` for Dutch or `en_GB` for
British English). Edit the
[LINGUAS](https://github.com/Hjdskes/gcolor3/blob/master/po/LINGUAS) file and add
your language code. Please keep the list sorted alphabetically. Lastly, open
the `.po` file you just generated and translate all the strings. Don't forget to
fill in the information in the header!

When a translation needs updating, execute the following commands:

```sh
$ meson build
$ ninja -C build gcolor3-update-po
```

When you are done translating, either make a pull request on GitHub or send me
the file via [email](mailto:hjdskes@gmail.com).

### Bugs
For any bug or feature request, please [create an
issue](https://github.com/Hjdskes/gcolor3/issues/new) on
GitHub.

