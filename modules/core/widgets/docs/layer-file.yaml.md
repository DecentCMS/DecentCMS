title: The widget layer file

-8<------------------------------------------------------------------

The widgets layer file can be found under
`/sites/name-of-the-site/widget/index.json`.
The `index.json` file describes the layers of widgets for the site.
Layers are collections of widgets that can be turned on or off by
an expression that is associated with each layer and that gets
evaluated for each request against an environment that can be
contributed to by modules, and that can use extension rules also
contributed by modules.
More than one layer can be active on any given page of the site.

For example, you can define a special layer for your home page, and
another for your documentation section, or for your product catalog,
or even for the first Tuesday of each month.

The default layer is usually defined with a rule of `true`, which
means that the widgets it contains will appear on all pages of the
site.

The [DecentCMS documentation site][decentdocs] has a second layer
that contains the navigation widgets for the documentation section.
The rule for this layer is:

```js
/^\/docs(\/api)?(\/.+)?$/.test(url)
```

This rule is JavaScript code that uses a regular expression to look
for a URL beginning with `/docs/` or `/docs/api/`.

The `url` variable used in this expression is made available by the
`url-layer-rule-context-builder` service.
It is possible to expose your own variables and functions to layer
expression evaluation by implementing a service for the
`layer-rule-context-builder` contract.

The `index.json` file consists of an object with top-level properties
that bear the names of each layer.
Each layer has a description, a rule, and a list of widgets.

In the list of widgets, each widget has a content item id (because
widgets are content items), and a "place".

The id will usually be of the form `widget:name-of-the-widget`, in
which case the system will look for the item's JSON description as
`/sites/name-of-the-site/widget/name-of-the-widget.json`.
It is however in principle possible to use the id of an arbitrary
content item in the site, which opens some fun possibilities.

The "place" consists of a top-level zone name that must exist in
[the theme's `layout` template][layout], a `:` colon, and an order
string.
The order string can be "before", to place the widget before all
others in this zone, "after", to put it after all others, or a
number.
It can also be a dotted number if necessary, such as "1.10.4".

Here is the layer file for [the DecentCMS web site][decentdocs]:

```json
{
  "default": {
    "description": "A layer applied to all pages.",
    "rule": "true",
    "widgets": [
      {
        "id": "widget:copyright",
        "place": "footer:after"
      },
      {
        "id": "widget:analytics",
        "place": "analytics:before"
      }
    ]
  },
  "documentation": {
    "description": "A layer that is displayed only on documentation pages.",
    "rule": "/^\\/docs(\\/api)?(\\/.+)?$/.test(url)",
    "widgets": [
      {
        "id": "widget:documentation-toc",
        "place": "leftSidebar:before"
      },
      {
        "id": "widget:documentation-breadcrumbs-top",
        "place": "main:before"
      },
      {
        "id": "widget:documentation-breadcrumbs-bottom",
        "place": "main:after"
      }
    ]
  }
}
```

   [decentdocs]: http://decentcms.org/docs
   [layout]: /docs/building-sites/writing-a-layout-template