+++
date = "2017-03-23T01:55:50+01:00"
title = "Google Summer of Code proposal contributions"
type = "Contribution"
+++

The application process of Google Summer of Code requires students to make a
small contribution to the project(s) of their choice to demonstrate that they
are capable of making a change following the upstream submission procedures. In
my understanding, this is less about the actual code than it is about
demonstrating these skills. This is (partly, the other reason being that as I was
working on these proposals I was also finishing up several course projects) the
reason that the contributions here are rather small:

For [GNOME Calendar](https://bugzilla.gnome.org/show_bug.cgi?id=774922) I fixed
the drag and drop mouse cursor when moving events around to show an arrow
indicating a move as opposed to a plus.

For [Mutter](https://bugzilla.gnome.org/show_bug.cgi?id=770020) I implemented a
fallback to a texture cursor in case the hardware cursor isn't available.

For [ratbagd](https://github.com/libratbag/ratbagd/pull/13)'s Python bindings I
implemented exception catching for some DBus exceptions, which would otherwise
[crash](https://github.com/libratbag/piper/issues/2) Piper when ratbagd wasn't
running.

I got accepted for 2017's GSoC and kept a blog on my progress. You can
read the introduction [here](/blog/gsoc-part-1/); an overview of the complete
series can be found [here](/series/google-summer-of-code/).
