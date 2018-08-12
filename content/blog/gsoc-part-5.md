+++
date = "2017-06-23T16:52:20+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "MouseMap" ]
title = "GSoC part 5: exams"
categories = "Development"
series = "Google Summer of Code"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

As mentioned in my [previous](/blog/gsoc-part-4) blog, the X.Org Foundation now
wants us to blog every week. Whilst that means shorter blogs (last week's was a
tad long), it also means that there isn't much to blog about if I didn't do much
in a week.

Such is the case for this week, sadly. It's the last week of university, and so
there are a few assignment deadlines that I needed to complete; I haven't been
able to invest as much time into my project as I would have wanted. That's oke
though, because as I said in the previous update I'm ahead of schedule. I
discussed this with Peter, my mentor, and we agreed that there is no problem.

So, what has actually been done the last week? Three things; first, I'm now
working on adding support for left-aligned buttons in the MouseMap widget. I
have something working, but I'm not quite happy with it yet. Definitely
something I hope to improve next week!

Second, highlighting SVG elements is now significantly cleaner. With the old
approach Piper would reload the SVG for every change, not that efficient. I came
across a [blog update](https://theawless.github.io/GSoC-Report-1/) of a GNOME
GSoC student, who also had to highlight SVG elements. After asking the Cairo
developers, he settled for drawing the button to a separate Cairo surface and
using that one as a [mask](https://www.cairographics.org/tutorial/#L3mask) to
draw the original surface. A clean and elegant solution for sure, much better
than my original approach!

Finally, Peter has [added](https://github.com/libratbag/libratbag/pull/183) an
API to libratbag to query a resolution's minimum and maximum DPI. We are going
to need this in Piper to correctly cap the possible values in the resolution
stack page.

That's all, folks! I hope to see you again next week when I've made up for this
lousy week!

This blog post is part of a [series](/series/google-summer-of-code/). You can read the next part
[here](/blog/gsoc-part-6) or the previous part about the first development
sprint [here](/blog/gsoc-part-4).
