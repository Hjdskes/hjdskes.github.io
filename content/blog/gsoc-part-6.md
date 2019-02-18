+++
date = "2017-06-30T16:11:24+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "MouseMap", "XPath", "XML" ]
title = "GSoC part 6: progress!"
categories = ["Projects"]
series = "Google Summer of Code"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

This week Piper saw some progress again! Today I opened the [pull request][pr]
for the MouseMap that I've been working on for the past two and a half weeks
now. I'll discuss the changes made since the last blog [later][mousemap]; first,
I want to highlight the other work I did the past week.

A major milestone this week is the [merging][merge] of ratbagd and libratbag.
While Piper shouldn't notice any of this (it talks to ratbagd over DBus), it's
still a highlight I want to mention. I also passed for the first evaluation, so
I can keep working &#9786;.

## Ratbagd LED API

libratbag has supported configuring LEDs for a while now, but this hadn't been
implemented in ratbagd yet. Piper will need the implementation in ratbagd in
order to expose the settings to the user, so last week I sat down to add the
missing code in ratbagd. You can see the resulting PR [here][ratbagdled].

Since Piper now manages its own ratbagd <q>bindings</q> (they really are just
DBus wrappers), I added support for the newly exposed DBus interface straight
away. This was merged [today][ratbagdledpiper].

## Minimum and maximum resolution in Piper's ratbagd bindings

Last week, my mentor exposed a device's minimum and maximum resolution through
libratbag and ratbagd. Today I quickly [implemented][ratbagdres] this in Piper's
ratbagd bindings, as well.

## Adhering to PEP8 in Piper

Adhering to a certain style is good. It makes your code consistent, which helps
when reading it. Since code is read more often than it is written, this is a
good thing.

The most used convention in Python is [PEP8][pep8]. From this week forward,
Piper [adheres][pep8-pr] to PEP8. We're using [flake8][flake8] to check this.
Personally I use flake8's [Git hook][flake8-hook], but we now also have a
[CircleCI build][circleci] running for every PR to run flake8. In the future,
this will probably also be used to run unit tests.

## Adding the finishing touches to the MouseMap

The most obvious change is that the MouseMap now also works with left-aligned
children:

![Left-aligned children](/img/blog/gsoc-part-6/mousemap-left-aligned.png)

Detecting where a widget should be aligned is rather straightforward, but it
took a while to get to where we are now. At first, the leaders ended with a
1&#215;1 pixel whose x-coordinate I queried. Coordinates with a value of zero
would be left aligned, and others right aligned. My mentor rightfully thought
that this wasn't a nice approach, because there is no meaning to this random
value. He suggested I talk with bentiss (Benjamin), who also had to lay out
buttons around an SVG for GNOME's settings daemon. Benjamin suggested that we
add back labels into the SVG, who would be right-aligned on the left side and
left-aligned on the right side (savvy? &#128521;). This worked, but 1) it
required that the drawn widgets are large enough to completely cover the labels
and 2) it messed up the calculation of the width, as there was no way to
determine how much the widget would overlap on the SVG. The solution here was to
remove the labels from the XML tree before opening a librsvg handle, but now
there were no labels left whose coordinates to check... Of course, we could
parse those ahead of time and remember all the coordinates, but we don't have
the element identifiers until the widgets are added to the container and by this
time the handle is already instantiated.

So, after a quick discussion, we settled somewhere in the middle of both
approaches. We again have all leaders end with a 1&#215;1 pixel, but we don't
check these pixels' x-coordinates. Instead, they have a style attribute that we
query for (at the moment, this is the `text-align` attribute, but this may
change in the future). The code now looks like this:

```python
def do_add(self, widget):
    """Not implemented, use `add(widget, svg_id)` instead."""
    pass

def add(self, widget, svg_id):
    """Adds the given widget to the map, bound to the given SVG element
    identifier. If the element identifier or its leader is not found in the
    SVG, the widget is not added.

    @param widget The widget to add, as Gtk.Widget
    @param svg_id The identifier of the SVG element with which this widget
                  is to be paired, as str
    """
    svg_leader = svg_id + "-leader"
    if widget is None or svg_id is None or not \
        self._handle.has_sub(svg_id) or not \
            self._handle.has_sub(svg_leader):
        return

    is_left = self._xpath_has_style(svg_leader[1:], "text-align:end")
    child = _MouseMapChild(widget, is_left, svg_id)
    self._children.append(child)
    widget.connect("enter-notify-event", self._on_enter, child)
    widget.connect("leave-notify-event", self._on_leave)
    widget.set_parent(self)
```

As you can see, we use [XPath][xpath] to query the XML tree for style
attributes. It's implemented like this:

```python
def _xpath_has_style(self, svg_id, style):
    # Checks if the SVG element with the given identifier has the given
    # style attribute set.
    namespaces = {
        'sodipodi': 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
        'cc': 'http://web.resource.org/cc/',
        'svg': 'http://www.w3.org/2000/svg',
        'dc': 'http://purl.org/dc/elements/1.1/',
        'xlink': 'http://www.w3.org/1999/xlink',
        'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
        'inkscape': 'http://www.inkscape.org/namespaces/inkscape'
    }
    query = "//svg:rect[@id=\"{}\"][contains(@style, \"{}\")]".\
            format(svg_id, style)
    element = self._svg_data.xpath(query, namespaces=namespaces)
    return element is not None and len(element) == 1 and element[0] is not None
```

The attentive reader may have noticed the `_MouseMapChild` class. This is an
implementation detail (hence it is private) to capture all data related to
children:

```python
class _MouseMapChild:
    # A helper class to manage children and their properties.

    def __init__(self, widget, is_left, svg_id):
        self._widget = widget
        self._is_left = is_left
        self._svg_id = svg_id
        self._svg_leader = svg_id + "-leader"

    @property
    def widget(self):
        # The widget belonging to this child.
        return self._widget

    @property
    def svg_id(self):
        # The identifier of the SVG element with which this child's widget is
        # paired.
        return self._svg_id

    @property
    def svg_leader(self):
        # The identifier of the leader SVG element with which this child's
        # widget is paired.
        return self._svg_leader

    @property
    def is_left(self):
        # True iff this child's widget is allocated to the left of the SVG.
        return self._is_left
```

To calculate the preferred width with left and right aligned children, we simply
iterate over the children and take for each side the maximum width:

```python
def do_get_preferred_width(self):
    """Calculates the container's initial minimum and natural width. While
    this call is specific to height-for-width requests (that we requested
    not to get) we cannot be certain that our wishes are granted and hence
    we must implement this method as well. We return the sum of the SVG's
    width, the natural child widths (left and right), spacing and border
    width.
    """
    width = 2 * self.props.border_width
    width_svg = self._handle.props.width
    width_left = max((child.widget.get_preferred_width()[1] for
                      child in self._children if child.is_left), default=0)
    width_right = max((child.widget.get_preferred_width()[1] for
                      child in self._children if not child.is_left),
                      default=0)
    width += width_left + width_svg + width_right + self.spacing
    if width_left > 0:
        width += self.spacing
    return (width, width)
```

Because we cannot reliably calculate whether children are positioned above or
below the SVG (the SVG elements may have arbitrary coordinates), we simply
assume that the SVG is tall enough to fit all children (which works because we
have control over the SVGs):

```python
def do_get_preferred_height(self):
    """Calculates the container's initial minimum and natural height. While
    this call is specific to width-for-height requests (that we requested
    not to get) we cannot be certain that our wishes are granted and hence
    we must implement this method as well. We just return the SVG's height
    plus the border widths.
    """
    # TODO: account for children sticking out under or above the SVG, if
    # they exist. At the moment we cannot reliably do so because the
    # y-coordinates of the leaders can have any arbitrary value. For now,
    # we assume that the SVG is high enough to fit all children and do not
    # worry about setups beyond the default GNOME Adwaita.
    height = self._handle.props.height + 2 * self.props.border_width
    return (height, height)
```

Finally, the coordinate system is now centric to the SVG with its origin to the
top left of the SVG such that the MouseMap will be drawn in the center of its
allocated width (this also shows how the highlighting is now done using masks,
as discussed in the previous blog entry):

```python
def do_size_allocate(self, allocation):
    """Assigns a size and position to the child widgets. Children may
    adjust the given allocation in their adjust_size_allocation virtual
    method implementation.

    @param allocation The position and size allocated to this container, as
                      Gdk.Rectangle
    """
    self.set_allocation(allocation)
    x, y = self._translate_to_origin()
    child_allocation = Gdk.Rectangle()

    for child in self._children:
        if not child.widget.get_visible():
            continue
        svg_geom = self._get_svg_sub_geometry(child.svg_leader)[1]
        nat_size = child.widget.get_preferred_size()[1]
        if child.is_left:
            child_allocation.x = x + svg_geom.x - self.spacing - nat_size.width
        else:
            child_allocation.x = x + svg_geom.x + self.spacing
        child_allocation.y = y + svg_geom.y + 0.5 * svg_geom.height - 0.5 * nat_size.height
        child_allocation.width = nat_size.width
        child_allocation.height = nat_size.height
        if not child.widget.get_has_window():
            child_allocation.x += allocation.x
            child_allocation.y += allocation.y
        child.widget.size_allocate(child_allocation)

def do_draw(self, cr):
    """Draws the container to the given Cairo context. The top left corner
    of the widget will be drawn to the currently set origin point of the
    context. The container needs to propagate the draw signal to its
    children.

    @param cr The Cairo context to draw into, as cairo.Context
    """
    cr.save()
    x, y = self._translate_to_origin()
    cr.translate(x, y)
    self._draw_device(cr)
    cr.restore()
    for child in self._children:
        self.propagate_draw(child.widget, cr)

def _translate_to_origin(self):
    # Translates the coordinate system such that the SVG and its buttons
    # will be drawn in the center of the allocated space. The returned x-
    # and y-coordinates will be the top left corner of the centered SVG.
    allocation = self.get_allocation()
    width = self.get_preferred_width()[1]
    height = self.get_preferred_height()[1]

    width_left = max((child.widget.get_preferred_width()[1] for
                      child in self._children if child.is_left), default=0)
    if width_left > 0:
        width_left += self.spacing

    x = (allocation.width - width) / 2 + self.props.border_width + width_left
    y = (allocation.height - height) / 2 + self.props.border_width
    return round(x), round(y)

def _draw_device(self, cr):
    # Draws the SVG into the Cairo context. If there is an element to be
    # highlighted, it will do as such in a separate surface which will be
    # used as a mask over the device surface.
    color = self.get_style_context().get_color(Gtk.StateFlags.LINK)
    cr.set_source_rgba(color.red, color.green, color.blue, 0.5)

    self._handle.render_cairo_sub(cr, id="#Device")
    if self._highlight_element is not None:
        svg_surface = cr.get_target()
        highlight_surface = svg_surface.create_similar(cairo.Content.COLOR_ALPHA,
                                                       self._handle.props.width,
                                                       self._handle.props.height)
        highlight_context = cairo.Context(highlight_surface)
        self._handle.render_cairo_sub(highlight_context,
                                      self._highlight_element)
        cr.mask_surface(highlight_surface, 0, 0)
    self._handle.render_cairo_sub(cr, id=self._layer)
```

All this work leads to the below video. You can find the pull request
[here][mousemap-pr].

<video controls>
  <source src="/img/blog/gsoc-part-6/mousemap.webm" type="video/webm">
Your browser does not support the video tag.
</video>

## In progress: reimplementing Piper according to the new mockups

As you can see from the video, I have started with a rough implementation of the
new window:

<video controls>
  <source src="/img/blog/gsoc-part-6/window.webm" type="video/webm">
Your browser does not support the video tag.
</video>

Next week I will attempt to implement the resolutions and begin with the
buttons!

This blog post is part of a [series](/series/google-summer-of-code/). You can read the next part about the
resolutions stack page [here](/blog/gsoc-part-7) or the previous part
[here](/blog/gsoc-part-5).

[pr]: https://github.com/libratbag/piper/pull/20
[mousemap]: /blog/gsoc-part-6#mousemap
[merge]: https://github.com/libratbag/libratbag/pull/184
[ratbagdled]: https://github.com/libratbag/ratbagd/pull/35
[ratbagdledpiper]: https://github.com/libratbag/piper/pull/17
[ratbagdres]: https://github.com/libratbag/piper/pull/21
[pep8]: https://www.python.org/dev/peps/pep-0008/#introduction
[pep8-pr]: https://github.com/libratbag/piper/pull/18
[flake8]: http://flake8.pycqa.org/en/latest/
[flake8-hook]: http://flake8.pycqa.org/en/latest/user/using-hooks.html
[circleci]: https://github.com/libratbag/piper/pull/22
[mousemap-pr]: https://github.com/libratbag/piper/pull/20
[xpath]: https://www.w3schools.com/xml/xpath_intro.asp
