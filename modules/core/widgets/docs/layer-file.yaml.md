title: The widget layer file

-8<------------------------------------------------------------------

The `index.json` file describes the layers of widgets for the site.
Layers are collections of widgets that can be turned on or off by
an expression that is associated with each of them and that gets
evaluated for each request against an environment that can be
contributed to by modules, and that can use extension rules also
contributed by modules.

The default layer is usually defined with a rule of `true`, which
means that the widgets it contains will appear on all pages of the
site.

...