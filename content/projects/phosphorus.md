+++
date = "2013-11-15T21:40:00+01:00"
title = "Phosphorus: a wallpaper browser and setter in the spirit of Nitrogen"
type = "Unmaintained"
+++

[Phosphorus](https://github.com/Hjdskes/phosphorus) is a wallpaper browser and
setter in the spirit of [Nitrogen](https://github.com/l3ib/nitrogen). It can be
considered an unofficial port of Nitrogen to GTK+ 3. Phosphorus is different,
however, in that it is plugin-based.

Phosphorus, at its core, is agnostic to how the selected image is applied as
wallpaper. There are many different Desktop Environments that all have their own
way of applying wallpapers. Soon, with Wayland becoming stable, every
lightweight compositor will have its own implementation as well. It is therefore
not viable for Phosphorus to implement all these different methods in its core.

That's why Phosphorus leverages plugins for these tasks. The idea is that every
Desktop Environment or every Wayland compositor has its own plugin to use its
own backend. These plugins can be written either in C or in Python 3, and can be
installed separately from Phosphorus.
