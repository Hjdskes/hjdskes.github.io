+++
date = 2018-09-01T00:00:21+02:00
title = "Gcolor3 version 2.3 is out!"
description = "A new release of Gcolor3"
tags = ["Gcolor3","Flatpak","GTK+"]
categories = ["Projects"]
+++

Finally, after a long period of sporadic commits, I released Gcolor3
version 2.3 out into the wild!

{{< gallery "/img/blog/gcolor3-v2.3/picker.png"
            "/img/blog/gcolor3-v2.3/saved.png"
            "/img/blog/gcolor3-v2.3/empty.png" >}}

This release was two years in the making (two years and twelve days,
to be precise). It features 67 commits, resulting in a redesigned
saved colors page, a redesigned headerbar and loads of under-the-hood
changes. In this post, I want to go into a little more detail on the
development and what led up to Gcolor 2.3. If you are here just to
install, head over to the install instructions on [Gcolor3's project
page](/projects/gcolor3). If you wish to view the release notes only,
those are at the [bottom of this page](#release-notes).

### Redesigning Gcolor3

I never did like the tree view that was used in previous versions of
Gcolor3 for its saved colors. The code was fine, but the UI looked
outdated and empty. There were no buttons in the tree view items, it
wasn't obvious that by clicking an item you could rename the color, et
cetera.

When a reported bug about <kbd>Ctrl</kbd>-<kbd>c</kbd> [not working in
the tree view](https://github.com/Hjdskes/gcolor3/issues/64) got
picked up by [Jan Tojnar](https://github.com/jtojnar), it opened up a
rabbit hole of edge cases. I decided to scrap the whole thing and
redesign this page to better fit in with [GNOME's
HIG](https://developer.gnome.org/hig/stable/).

I made two mockups. Both used a
[GtkListBox](https://developer.gnome.org/gtk3/stable/GtkListBox.html),
a widget that is used often in GNOME applications for content such as
saved colors. The first one has each row colored with the color it
belongs to. This worked nice with matching colors, but clashed hard
when the colors didn't go together well. The second design row simply
had a small thumbnail to show the color. This left a lot of
whitespace.

{{< gallery "/img/blog/gcolor3-v2.3/Gcolor3-colored-rows.png"
            "/img/blog/gcolor3-v2.3/Gcolor3-thumbnails.png" >}}

When I [asked for
feedback](https://github.com/Hjdskes/gcolor3/pull/92#issuecomment-414073545),
[Julian Richen](https://github.com/julianrichen) mentioned that I
could simply make the rows smaller and centered on the page, as is
common in many GNOME applications. I opted to go with this solution
(and thus design #2), as it not only fit better with the HIG but also
is generally a better design. In the first mockup, for example, what
color would a row be when it is selected? It can't simply be the
theme's selected color, because then the user cannot see what color
they selected. We can make it another color with some custom CSS, but
this would still be the same problem. Going completely custom with our
own effect would detract from one of the main reasons to redesign the
page in the first place: to integrate better with the GNOME
desktop. The idea was nice, but it didn't work out in practice.

In the process of development, I refactored the color store (where
Gcolor3 centrally keeps track of saved colors, even between different
instances running simultaneously) to do away with its custom [GObject
signals](https://developer.gnome.org/gobject/stable/gobject-Signals.html)
and instead implement the
[GListModel](https://developer.gnome.org/gio/stable/GListModel.html)
interface. This allows us to bind the store to the list box widget,
meaning the list box will update itself automagically. All that we
need to do now is add, remove or rename colors in the store and the
rest will be done for us. This significantly simplifies the codebase,
where we had to do all this ourselves based on the signals emitted by
the store.

I also added a proper empty state for when there are no saved
colors. Following more feedback on the design, I also made the
thumbnails have a border radius (following the current GTK+ theme) and
I added a button to copy the color as well (as opposed to having only
a keyboard shortcut for this). And of course, the bug leading to this
whole redesign was fixed in the process, as well 😉.

Thanks Jan and Julian for your cooperation on this issue!

### Wayland support: past, present and future

Early 2016 I got a bug report that Gcolor3 does not work on
Wayland: picking a color had no effect. This wasn't surprising, as the
[GtkColorSelection](https://developer.gnome.org/gtk3/stable/GtkColorSelection.html)
widget I was using was a deprecated widget, after all. Nonetheless,
this is an issue that needs to be fixed. A color picker isn't much of
a color picker when it cannot pick colors, is it?

In late 2017, users reported Gcolor3 crashing GNOME Shell when trying
to pick a color under Wayland. This was obviously a bigger problem
that couldn't wait for a solution from the Wayland camp. With the
color selection widget being deprecated and indeed already removed
from what will be GTK+ 4, I [imported
it](https://github.com/Hjdskes/gcolor3/pull/67) (and its dependency,
[GtkHSV](https://developer.gnome.org/gtk3/stable/GtkHSV.html)) into
Gcolor3. The aptly named `Gcolor3ColorSelection` widget now checks
whether it is running on Wayland, and if so, makes the picker button
insensitive. This is the best I could do, until a general solution for
picking a color was available on Wayland.

Meanwhile, I opened a [bug
report](https://bugzilla.gnome.org/show_bug.cgi?id=789756) on GNOME
Shell to discuss the addition of a color picking interface. The
outcome of this discussion was to add an interface to the XDG desktop
portals. All of those bits are now in-place ([XDG desktop portal
interface](https://github.com/flatpak/xdg-desktop-portal/pull/202),
[GNOME's desktop portal
implementation](https://github.com/flatpak/xdg-desktop-portal-gtk/pull/134),
[GNOME Shell
implementation](https://gitlab.gnome.org/GNOME/gnome-shell/merge_requests/171),
[KDE's desktop portal
implementation](https://github.com/KDE/xdg-desktop-portal-kde/commit/ee590b2242257f6b96edda6a784b3972ee272387)
and finally, [KWin's
implementation](https://phabricator.kde.org/D3481)). With version 2.3
out the door, I will now be focusing on implementing this interface
and getting color picking working again on Wayland!

### Other changes

The GNOME desktop has been steadily advancing over the last two
years. Two recent technologies that have modernized GNOME are the
[Meson build system](http://mesonbuild.com) and
[Flatpak](https://flatpak.org/). Following these trends, Gcolor3 is
now building with Meson and packages as a Flatpak! The [pull
request](https://github.com/flathub/flathub/pull/601) to add it to
Flathub, the Flatpak store, is open!

If you are more a fan of the traditional package manager approach,
this release should excite you as well. Gcolor3 was already being
packaged unofficially for Fedora, but it is now in the process of
being included officially! If you are more of an Ubuntu guy (or gal),
there is now an unofficial PPA for
[Ubuntu](https://launchpad.net/~evertiro/+archive/ubuntu/gcolor3)!

### Future work

The biggest pain point right now is obviously Wayland (note: this is
***not*** a complaint towards Wayland itself -- in fact, I believe
Wayland is the future), so this is what I will work on first.

After this, I want to modernize the imported `Gcolor3ColorSelection`
and `Gcolor3HSV` widgets. There are some chances to use modern APIs
there that will reduce the amount of boilerplate code. Furthermore, I
have already made some progress on porting them to use `GdkRGBA` when
I imported them, but there are some places left to apply this change
to. I hope this will result in less overall conversion between
different formats.

Now that those widgets are under our control, I also think it's time
for a redesign of those widgets. I'm not sure yet where I want to go,
but I have opened an
[issue](https://github.com/Hjdskes/gcolor3/issues/96) to gather
ideas. If you have any, please do let me know!

Finally, I want to make the saved colors sortable. Right now, the list
is static and colors are sorted in order of insertion. Obviously,
users might want to sort colors to group them together or some such.

As you can see, there is plenty left to improve Gcolor3. Besides these
changes, [GTK+ 4 is on the horizon as
well](https://github.com/Hjdskes/gcolor3/issues/88). The future is
exciting!

### Release notes

* Fix AppData for inclusion in Fedora, Flatpak ([#60](https://github.com/Hjdskes/gcolor3/issues/60))
* Import deprecated GtkColorSelection and GtkHSV ([#67](https://github.com/Hjdskes/gcolor3/pull/67))
* Fix crashing GNOME Shell on Wayland ([#67](https://github.com/Hjdskes/gcolor3/pull/67))
* Package Gcolor3 as Flatpak ([#72](https://github.com/Hjdskes/gcolor3/pull/72))
* Port Gcolor3 to the Meson build system ([#83](https://github.com/Hjdskes/gcolor3/pull/83))
  * This removes a dependency on intltool.
* Gcolor3ColorStore: mention that warnings are harmless on first run ([#84](https://github.com/Hjdskes/gcolor3/issues/84))
* Fix CTRL-C and other keyboard shortcuts ([#64](https://github.com/Hjdskes/gcolor3/issues/64))
* Redesigned saved color page ([#92](https://github.com/Hjdskes/gcolor3/pull/92))
* Redesigned header bar ([#92](https://github.com/Hjdskes/gcolor3/pull/92))
* Add a GtkShortcutswindow ([#93](https://github.com/Hjdskes/gcolor3/pull/93))
  * This bumps the required version of GTK+ 3 to 3.20.
* Add a manual page ([#99](https://github.com/Hjdskes/gcolor3/pull/99))
* Publish Gcolor3 on Flathub ([#87](https://github.com/Hjdskes/gcolor3/issues/87))
* There is now a PPA to install Gcolor3 on Ubuntu ([#21](https://launchpad.net/~evertiro/+archive/ubuntu/gcolor3))
* New translations: Norwegian Bokmål, Indonesian, Russian, Spanish
* Updated translations: Dutch, British English, German, Serbian
* Removed outdated translations (from build): French, Galician, Greek, Indonesian, Norwegian Bokmål, Spanish, Swedish, Ukranian
