+++
date = "2017-06-16T20:47:56+02:00"
description = "GSoC blog series on rewriting Piper"
tags = [ "Piper", "fdo", "Gtk", "container", "MouseMap", "ratbagd" ]
title = "GSoC part 4: the first sprint"
categories = "Development"
series = "Google Summer of Code"
+++

![GSoC logo horizontal](/img/blog/gsoc-part-1/GSoC-logo-horizontal.svg)

This is going to be a long one, so grab a drink and a snack and buckle up!
Incidentally, the X.Org foundation has asked us, the 2017 GSoC students, to blog
weekly so from now on I will do so; which will also mean smaller blogs in the
future.

I made a schedule to go with my proposal in which I divided the coding period
into two week sprints to plan out my project. Since the coding period started on
a Tuesday (May 30), my sprints start on Tuesdays and end on Mondays. At the
moment, I am ahead of schedule and will likely adjust it -- if I do that, I'll
make sure to align sprint ends on Fridays so they align with my weekly updates.

Anyway, what have I done in the previous sprint? How nice of you to ask! Quite a
lot, actually (as I said, I'm ahead of schedule!).

### Updating the mockups

As you know if you've read the [previous blog post][previous], I began with
designing the new Piper and making mockups to demo these designs. Last week I
discussed these mockups with [Jakub Steiner][jakub], one of GNOME's designers.

Overall, Jakub thought the designs felt a lot like <q>engine tuning</q>, i.e.
specialized operations that you need specialist knowledge for and not something
you want to shove in front of every day users (while discussing this, he linked
me to [shit work][shit] as recommended reading). We agreed, however, that this
is probably OK considering that Piper is mostly targeted towards gamers or other
enthusiasts who deliberately buy a gaming mouse for these features, and are thus
expected to know how they work and what they can do.

After discussing that, Jakub had the following feedback on the mockups:

1. The <q>legend</q> approach (i.e. having an image with button labels, and
   having to search for those labels in an adjacent list to configure those
   buttons), is a nightmare (in fact, it reminded him of old school bus tables
   -- I wouldn't know how those looked, I'm from '94 &#128521;). As an
   alternative, he suggested that we introduce a <q>capture button</q> mode that
   allows the user to press a button on their physical device to highlight the
   button in the SVG and directly open the configuration dialog.  This is
   however not currently supported in libratbag, although in the future it may
   be. I plan on starting a discussion on this topic once libratbag and ratbagd
   [have been merged][merge], as this is the first step towards enabling this
   feature.  Until then, we went for a visual mapping of the buttons' locations,
   arranging the markings so that they directly associate to the assigned
   action.  When the action is hovered with the cursor, the button in the SVG is
   highlighted.
2. Profile management seems a little odd. It implies that you would switch
   profiles often, when instead they are a <q>set-and-forget</q> kind of thing.
   While true, Peter and I felt that they are already quite hidden away and
   decided to leave it as-is -- at least for the time being.
3. The general interface depends on having nice graphics for each device. To
   streamline the UI and be less dependent on good looking, functional
   illustrations, Jakub suggested we use toned down illustrations instead. He
   offered his help to make a bunch, and work is [in-progress][toned-down-svgs].

As an example, this is how the button assignment stack page will look now:

![Button assignment stack page](/img/blog/gsoc-part-4/buttons.png)

Much better! All the updated mockups can be seen on the [Redesign Wiki][wiki].

### A custom GTK+ container: MouseMap

These new mockups required us to position our widgets on arbitrary x- and
y-coordinates, relative to their markings in the SVG. The SVG image also has to
be drawn in the background and edited dynamically to show the highlights. That's
all well and good, if not for one problem (don't we love solving problems!):
there is no readily made GTK+ widget that allows us to do all this.

Because the design is similar to GNOME's Wacom settings, the first step was to
[check how they do it][gnome-control-center]: a [GtkGrid][gtkgrid]. This works
for them because they have to display only a single stylus, with a static amount
of buttons. For Piper, however, we need to display a range of devices that all
have a different amount of buttons. Queue our problem again: there is no such
widget.

As any good software engineer then, we roll up our sleeves and create our own! A
quick trip to `#gtk+` on GNOME's IRC taught me that I want to create <q>a custom
container widget, with a custom `draw()` implementation that renders the SVG
using librsvg and Cairo on the drawing context, and then positions the child
widgets at the given coordinates for each SVG node</q>. Sounds easy right?
Exactly what I thought &#128521;

The following few paragraphs discuss the implementation of this custom
container. If you're not interested in this, just scroll past the shiny picture
in the end towards [the next section][next-section].

For those not in the know, GTK+ is an object-oriented widget toolkit built on top
of GLib. To implement our own custom container widget we thus need to subclass
[`Gtk.Container`][gtkcontainer] and implement the required methods.

Subclassing a GTK+ widget class in Python is just like subclassing a regular
Python class; you declare the base class and you chain to its `__init__` method:

```python
class MouseMap(Gtk.Container):
    """A Gtk.Container subclass to draw a device SVG with child widgets that
    map to the SVG. The SVG should have objects with identifiers, whose value
    should also be set on a custom `id` property of any child added to this
    container. See https://github.com/libratbag/libratbag/blob/master/data/README.md
    and do_size_allocate for more information.
    """

    __gtype_name__ = "MouseMap"

    __gproperties__ = {
        "spacing": (int,
                    "spacing",
                    "The amount of space between children and the SVG leaders",
                     0, GLib.MAXINT, 0,
                     GObject.PARAM_READWRITE),
    }

    def __init__(self, ratbag_device, spacing, layer):
        Gtk.Container.__init__(self)
```

This creates a new `GObject.GType`, which is connected to the new Python type.
`__gtype_name__` specifies a custom GType name, but isn't required.

`__gproperties__` adds, well, properties to the class. They are accessible as
any regular Python property, but because they are declared through GObject they
are typed, get minimum, maximum and default values, can be set read-only,
write-only or readwrite and finally, they can be watched for changes.

In `__init__`, we initialize the MouseMap object:

```python
def __init__(self, ratbag_device, spacing, layer):
    """Instantiates a new MouseMap.

    @param ratbag_device The device that should be mapped, as ratbagd.RatbagdDevice
    @param spacing The spacing between the SVG leaders and the children, as int
    @param layer The SVG layer whose leaders to draw.

    @raises GLib.Error when the SVG cannot be loaded.
    """
    Gtk.Container.__init__(self)
    self.set_has_window(False)
    self._children = []
    self._device = ratbag_device
    self.spacing = spacing
    self._layer = layer

    if not os.path.isfile(ratbag_device.svg_path):
        stream = Gio.Resource.open_stream("/org/freedesktop/Piper/404.svg",
                                          Gio.ResourceLookupFlags.NONE)
        self._handle = Rsvg.Handle.new_from_stream(stream, None,
                                                   Rsvg.HandleFlags.FLAGS_NONE,
                                                   None)
    else:
        self._handle = Rsvg.Handle.new_from_file(ratbag_device.svg_path
```

A `Gtk.Container` subclass needs to implement `Gtk.Container`'s interface
methods and a few `Gtk.Widget` interface methods that deal with geometry
management.

#### `Gtk.Container` interface methods

GtkContainerClass's official C [documentation][gtkcontainerclass] mentions the
virtual methods (<q>interface methods</q>) that each subclass has to implement.
The [API documentation][gtkcontainer-vfunc] for PyGObject lists them specific to
Python:

##### `do_add (widget)` and `do_remove (widget)`

As their names imply, these functions add or remove the given widget to or from
the container.  More complicated containers may provide alternative methods, see
e.g. [`Gtk.Box.pack_start(child, expand, fill, padding)`][gtkbox-pack-start]. A
container containing only internal widgets (i.e. added by the container
implementation itself and not a user of the container) need not implement these
methods.

The implementations are really quite straightforward:

```
def do_add(self, widget):
    """Adds the given widget to the map. The widget must have a custom
    property named `id` with value the identifier of the SVG element with
    which it must be paired.

    @param widget The widget to add, as Gtk.Widget
    """
    try:
        widget.id
    except AttributeError:
        print("Widget must have a custom `id` property, skipping.")
        return
    if not widget is None:
        self._children.append(widget)
        widget.set_parent(self)
        widget.connect("enter-notify-event", self._on_enter)
        widget.connect("leave-notify-event", self._on_leave)

def do_remove(self, widget):
    """Removes the given widget from the map.

    @param widget The widget to remove, as Gtk.Widget
    """
    if not widget is None:
        for child in self._children:
            if child == widget:
                self._children.remove(child)
                child.unparent()
                break
```

We'll get to the `enter-notify-event` and `leave-notify-event` signals
[later][interactive].

##### `do_check_resize ()`

Emits the `check-resize` signal, forcing the recalculation of the container and
its children. The default implementation in `Gtk.Container` is fine for us.

##### `do_child_type ()`

This method returns the type of the children that this container supports. The
MouseMap widget accepts any GTK+ widget, so we simply state as such:

```python
def do_child_type(self):
    """Indicates that this container accepts any GTK+ widget."""
    return Gtk.Widget.get_type()
```

##### `do_forall (include_internals, callback, callback_data)`

`do_forall` invokes `callback` on each (direct) child widget, including internal
children iff `include_internals` is `True`, with `callback_data` as arguments.
Implementing this method is required for every container, because it is used for
drawing and other internal GTK+ operations.

```python
def do_forall(self, include_internals, callback, *parameters):
    """Invokes the given callback on each child, with the given parameters.

    @param include_internals Whether to run on internal children as well, as
                             boolean. Ignored, as there are no internal
                             children.
    @param callback The callback to call on each child, as Gtk.Callback
    @param parameters The parameters to pass to the callback, as object or None
    """
    if not callback is None:
        for child in self._children:
            callback(child, *parameters)
```

##### `do_set_child_property (child, property_id, value, pspec)` and `do_get_child_property (child, property_id, value, pspec)`

Containers introduce child properties: object properties that are not specific
to either the container or its child, but rather the relation between them
(e.g., a child's position). Child properties are installed with
`Gtk.Container.install_child_property(property_id, pspec)` or
`Gtk.Container.install_child_properties(pspecs)` and queried through
`Gtk.Container.find_child_property(property_name)` or
`Gtk.Container.list_child_properties()`.

The implementation of these two methods is the container-specific way to set and
get these (container-specific) child properties. Currently, the MouseMap widget
does not implement them, as there are no child properties yet. It is however
possible that in the future there will be a MouseMapChild class that wraps a
child widget with its x- and y-coordinates and SVG element identifier. In this
case, these methods will have to be implemented.

##### `do_get_path_for_child (child)`

This methods returns a widget path, representing the widget hierarchy from the
toplevel widget down to and including `child`. The default `Gtk.Container`
implementation is fine.

##### `do_set_focus_child (child)`

This method sets (or unsets, if child is `None`) the focused child of the
container. The default implementation is again fine.

#### `Gtk.Widget` interface methods

Finally, MouseMap needs to implement a few `Gtk.Widget` interface methods to
manage its geometry. GTK+ uses a height-for-width or width-for-height geometry
system, where for example height-for-width means that a widget given an amount
of horizontal space can change how much vertical space it needs. The most
obvious example is a label that reflows its text to fill up the available width
will wrap to fewer (or more) lines and therefore needs less (or more) height.
For more information, see the [official GtkWidget C documentation][gtkwidget].
But, there's more! For containers, [special things][gtkcontainer-c] need to be
taken into consideration:

1. A container needs to prioritize one of its dimensions; a container can only
   have a size request mode of `GTK_SIZE_REQUEST_HEIGHT_FOR_WIDTH` or
   `GTK_SIZE_REQUEST_WIDHT_FOR_HEIGHT` and not `GTK_SIZE_REQUEST_CONSTANT_SIZE`.
2. Even though point 1, every widget and container must be able to respond to
   both APIs because it cannot be ensured that a widget is requested to use its
   declared preference.

This way of managing geometry is implemented through a few virtual methods that
a widget should implement:

##### `do_get_request_mode()`

This method returns the `Gtk.SizeRequestMode` preferred by the container, which
tells any parent widget whether it prefers a height-for-width or a
width-for-height layout.

Since the MouseMap's geometry is rather static and we are a custom container
with control over the amount and placement of child widgets, we simply return
`Gtk.SizeRequestMode.CONSTANT_SIZE`:

```python
def do_get_request_mode(self):
    """Gets whether the container prefers a height-for-width or a
    width-for-height layout. We don't want to trade width for height or
    height for width so we return CONSTANT_SIZE."""
    return Gtk.SizeRequestMode.CONSTANT_SIZE
```

##### `do_get_preferred_height()` and `do_get_preferred_width()`

These methods return the container's initial minimum and natural height and
width. Since the MouseMap is static with regards to geometry, we don't have to
do anything fancy here. For the preferred minimum and natural height, we simply
return the maximum of the SVG's height and the summed minimum and natural height
of the children, plus the border width which is also allocated on the top and
bottom edges of the container. For the preferred minimum and natural width, we
return the SVG's width plus the maximum minimum (savvy?) and natural width, the
border width and the spacing property.

```python
def do_get_preferred_height(self):
    """Calculates the container's initial minimum and natural height. While
    this call is specific to width-for-height requests (that we requested
    not to get) we cannot be certain that our wishes are granted and hence
    we must implement this method as well. In any case, we just return the
    maximum of the SVG's height or the children's summed (minimum and
    natural) height, including the border width."""
    svg_height = self._handle.props.height
    children_height_min = 0
    children_height_nat = 0
    for child in self._children:
        child_min, child_nat = child.get_preferred_height()
        children_height_min += child_min
        children_height_nat += child_nat
    height_min = max(svg_height, children_height_min) + 2 * self.props.border_width
    height_nat = max(svg_height, children_height_nat) + 2 * self.props.border_width
    return (height_min, height_nat)

def do_get_preferred_width(self):
    """Calculates the container's initial minimum and natural width. While
    this call is specific to height-for-width requests (that we requested
    not to get) we cannot be certain that our wishes are granted and hence
    we must implement this method as well. In any case, we just return the
    SVG's width, including the maximum (minimum and natural) child width,
    border width and spacing."""
    # TODO: account for left-aligned children, if they exist
    svg_width = self._handle.props.width
    children_width_min = 0
    children_width_nat = 0
    for child in self._children:
        child_min, child_nat = child.get_preferred_width()
        children_width_min = max(children_width_min, child_min)
        children_width_nat = max(children_width_nat, child_nat)
    width_min = svg_width + children_width_min + 2 * self.props.border_width + self.spacing
    width_nat = svg_width + children_width_nat + 2 * self.props.border_width + self.spacing
    return (width_min, width_nat)
```

##### `do_get_preferred_height_for_width(width)` and `do_get_preferred_width_for_height(height)`

These are the contextual methods that return the container's minimum and natural
height and width given the specified width and height. Again, as the MouseMap is
static in regards to geometry we simply return `do_get_preferred_height` and
`do_get_preferred_width`:

```python
def do_get_preferred_height_for_width(self, width):
    """Returns this container's minimum and natural height if it would be
    given the specified width. While this call is specific to
    height-for-width requests (that we requested not to get) we cannot be
    certain that our wishes are granted and hence we must implement this
    method as well. Since we really want to be the same size always, we
    simply return do_get_preferred_height.

    @param width The given width, as int. Ignored.
    """
    return self.do_get_preferred_height()

def do_get_preferred_width_for_height(self, height):
    """Returns this container's minimum and natural width if it would be
    given the specified height. While this call is specific to
    width-for-height requests (that we requested not to get) we cannot be
    certain that our wishes are granted and hence we must implement this
    method as well. Since we really want to be the same size always, we
    simply return do_get_preferred_width.

    @param height The given height, as int. Ignored.
    """
    return self.do_get_preferred_width()
```

##### `do_size_allocate(allocation)`

This is a `Gtk.Widget` method only used by `Gtk.Container` subclasses. It is
used to assign a size and position to child widgets, so this is where we align
the widgets with their markings in the SVG.

The implementation below loops through the child widgets, and for each child
does the following:

1. retrieve its SVG identifier;
2. ask the child for its preferred size;
3. using the SVG identifier, look up the position and dimensions of the SVG
   element;
4. Position the child after the SVG element, and allocate it its preferred width
   and height.

The current implementation does not yet work with device SVGs that also have
markings extend to the left.

```python
def do_size_allocate(self, allocation):
    """Assigns a size and position to the child widgets. Children may adjust
    the given allocation in the adjust_size_allocation virtual method.

    This method uses a custom property on the children to position them
    relative to their SVG counterparts. Children that you want to be
    positioned should have an `id` property set on them, with value the SVG
    identifier they should position themselves next to. Children without
    this property are skipped.

    @param The position and size allocated to this container, as Gdk.Rectangle
    """
    # TODO: account for left-aligned children, if they exist
    self.set_allocation(allocation)
    child_allocation = Gdk.Rectangle()
    for child in self._children:
        svg_id = child.id + "-leader"
        if child.get_visible():
            min_size, nat_size = child.get_preferred_size()
            child_allocation.width = nat_size.width
            child_allocation.height = nat_size.height

            ok, svg_geom = self._get_svg_sub_geometry(svg_id)
            if not ok:
                continue
            child_allocation.x = svg_geom.x + svg_geom.width + self.spacing
            child_allocation.y = svg_geom.y - 0.5 * child_allocation.height
            if not child.get_has_window():
                child_allocation.x += allocation.x
                child_allocation.y += allocation.y
            child.size_allocate(child_allocation

def _get_svg_sub_geometry(self, svg_id):
    """Helper method to get an SVG element's x- and y-coordinates, width and
    height.

    @param svg_id The identifier of the SVG element whose geometry to get.
    @returns (bool, Gdk.Rectangle)
    """
    ret = Gdk.Rectangle()
    ok, svg_pos = self._handle.get_position_sub(svg_id)
    if not ok:
        print("Warning: cannot retrieve element's position:", svg_id, file=sys.stderr)
        return ok, ret
    ok, svg_dim = self._handle.get_dimensions_sub(svg_id)
    if not ok:
        print("Warning: cannot retrieve element's dimensions:", svg_id, file=sys.stderr)
        return ok, ret
    ret.x = svg_pos.x
    ret.y = svg_pos.y
    ret.width = svg_dim.width
    ret.height = svg_dim.height
    return ok, ret
```

##### `do_draw(cr)`

Finally, the method that draws the SVG into the container's drawing context.
It's rather self explanatory: ask the SVG if it has the required layers and if
so, we draw only those. Otherwise, we draw the entire SVG. Finally, we propagate
the draw signal to all children so they draw themselves on top of the SVG.

```python
def do_draw(self, cr):
    """Draws the container to the given Cairo context. The top left corner
    of the widget will be drawn to the currently set origin point of the
    context. The container needs to propagate the draw signal to its
    children.

    @param cr The Cairo context to draw into, as cairo.Context
    """
    # TODO: account for left-aligned children, if they exist
    if self._handle.has_sub(id="#Device") and self._handle.has_sub(id=self._layer):
        self._handle.render_cairo_sub(cr, id="#Device")
        self._handle.render_cairo_sub(cr, id=self._layer)
    else:
        self._handle.render_cairo(cr)

    for child in self._children:
        self.propagate_draw(child, cr)
```

#### Interactive highlighting of the SVG

If you've made it this far, you might have forgotten that the SVG has to be
interactive: if a widget is hovered by the cursor, that widget's SVG element
should be highlighted. This requires on-the-fly editing of the SVG image, by
inserting and removing CSS markup dynamically. Luckily, there was [some code][gtksvg] I
could use in GTK+.

Remember that in `do_add(widget)` we connected to that widget's
`enter-notify-event` and `leave-notify-event` signals? These signals are fired
when the mouse cursor enters and leaves the widget's window. Here's how we do
that:

```python
def _on_enter(self, widget, event):
    svg_width = self._handle.props.width
    svg_height = self._handle.props.height
    try:
        _, file_data = GLib.file_get_contents(self._device.svg_path)
    except GLib.Error as e:
        print("Cannot get SVG file contents: {}, cannot highlight SVG\
              elements".format(e.message), file=sys.stderr)
        return
    stream = Gio.MemoryInputStream.new_from_data(file_data, None)
    escaped_file_data = GLib.markup_escape_text(file_data, -1)

    data = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
              <svg version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xi="http://www.w3.org/2001/XInclude"
                width="%s"
                height="%s">
                <style type="text/css">
                  %s {
                    stroke: #2a76c6 !important;
                    stroke-width: 2 !important;
                  }
                </style>
                <xi:include href="data:text/xml,%s"/>
              </svg>""" % (svg_width, svg_height, widget.id, escaped_file_data)

    stream = Gio.MemoryInputStream.new_from_data(data.encode('UTF-8'), None)
    try:
        handle = Rsvg.Handle.new_from_stream_sync(stream, None,
                                                  Rsvg.HandleFlags.FLAGS_NONE,
                                                  None)
    except GLib.Error as e:
        print("Cannot create new SVG handle: {}".format(e.message),
              file=sys.stderr)
        return
    self._handle = handle
    self._redraw_svg_element(widget.id)

def _on_leave(self, widget, event):
    """Restores the device SVG to its original state (i.e., simply reloads
    the device's SVG).

    @param widget The widget that fired this signal, as Gtk.Widget
    @param event The Gdk.EventCrossing that triggered this signal.
    """
    try:
        handle = Rsvg.Handle.new_from_file(self._device.svg_path)
    except GLib.Error as e:
        print("Cannot load SVG: {}. Restoring not possible".format(e.message),
              file=sys.stderr)
        return
    self._handle = handle
    ok, svg_geom = self._get_svg_sub_geometry(widget.id)
    self._redraw_svg_element(widget.id)

def _redraw_svg_element(self, svg_id):
   """Helper method to redraw an element of the SVG image. Attempts to
   redraw only the element plus an offset, but will fall back to redrawing
   the complete SVG.

   @param svg_id The identifier of the SVG element to redraw.
   """
   ok, svg_geom = self._get_svg_sub_geometry(svg_id)
   if not ok:
       svg_width = self._handle.props.width
       svg_height = self._handle.props.height
       self.queue_draw_area(0, 0, svg_width, svg_height)
   else:
       self.queue_draw_area(svg_geom.x - 10, svg_geom.y - 10,
                            svg_geom.width + 20, svg_geom.height + 20)
```

All that work has resulted in the following animation:

<video controls>
  <source src="/img/blog/gsoc-part-4/mousemap-interactive.webm" type="video/webm">
Your browser does not support the video tag.
</video>

Pretty darn cool, if I say so myself!

### Importing ratbagd's bindings

ratbagd [dropped][dropped] its Python bindings, because <q>they were mostly
boilerplate and 1:1 mapping of the DBus interface anyway</q>. This was actually
good news for Piper, as we can now customize the bindings specifically to
Piper's needs. I [imported][import] the removed bindings and [updated][update]
them to reflect the current features of libratbag and ratbagd (for this,
[ratbagd][ratbagd-update] also had to be updated).

In the process I GObject-ified the bindings so that they inherit from GObject.
This allows us to emit GObject signals when we receive a signal over DBus and
expose the DBus interfaces' properties as GObject properties. The advantage of
this approach is that the Piper code can add signal handlers to these signals
using `Ratbagd*.connect("<signal>", <callback>)` which are called when the
signals are emitted, and watch for property changes  using
`Ratbagd*.connect("notify::<property>", <callback>)`.

### What's next?

The next item on the schedule is to finish the MouseMap widget and reimplement
Piper's main window following the mockups. According to the schedule, this
window should have the same functionality as the current Piper. I now doubt this
is a realistic goal, because so much has changed from the current design.
However, considering that the MouseMap is almost done, I can definitely get a
long way before this sprint is over!

This blog post is part of a [series](/series/gsoc/). You can read the next part
[here](/blog/gsoc-part-5) or the previous part about
designing and making the mockups [here][previous].

[previous]: /blog/gsoc-part-3
[jakub]: http://jimmac.musichall.cz/
[shit]: https://zachholman.com/posts/shit-work/
[merge]: https://github.com/libratbag/libratbag/issues/179
[toned-down-svgs]: https://github.com/libratbag/libratbag/pull/182
[wiki]: https://github.com/libratbag/piper/wiki/Piper-Redesign
[gnome-control-center]: https://github.com/GNOME/gnome-control-center/blob/master/panels/wacom/wacom-stylus-page.ui#L115
[gtkgrid]: https://developer.gnome.org/gtk3/stable/GtkGrid.html
[next-section]: /blog/gsoc-part-4#importing-ratbagd-s-bindings
[gtkcontainer]: https://lazka.github.io/pgi-docs/Gtk-3.0/classes/Container.html
[gtkcontainerclass]: https://developer.gnome.org/gtk3/stable/GtkContainer.html#GtkContainerClass
[gtkcontainer-vfunc]: https://lazka.github.io/pgi-docs/Gtk-3.0/classes/Container.html#virtual-methods
[gtkbox-pack-start]: https://lazka.github.io/pgi-docs/Gtk-3.0/classes/Box.html#Gtk.Box.pack_start
[interactive]: /blog/gsoc-part-4#interactive-highlighting-of-the-svg
[gtkwidget]: https://developer.gnome.org/gtk3/stable/GtkWidget.html
[gtkcontainer-c]: https://developer.gnome.org/gtk3/stable/GtkContainer.html
[gtksvg]: https://github.com/GNOME/gtk/blob/4724a89022ef1bec93b1a42d4cf2fec7191ed712/gtk/encodesymbolic.c#L43
[dropped]: https://github.com/libratbag/ratbagd/pull/27
[import]: https://github.com/libratbag/piper/pull/8
[update]: https://github.com/libratbag/piper/pull/10
[ratbagd-update]: https://github.com/libratbag/ratbagd/issues/29
