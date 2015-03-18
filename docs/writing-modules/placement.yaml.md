title: Placement files
number: 10

-8<------------------------------------------------------------------

Placement files describe how to dispatch shapes into zones.
They are necessary in order to decouple UI composition from
individual templates.
Templates can focus on what to render, while placement determine what
to render where.

There can be a placement file at the root of each module and theme.
A placement file can either be a `placement.json` file, or a
`placement.js` file if the format for JSON placement files is not
sufficiently flexible for the problem at hand.

Placement works in a relative manner: more than one content item can
appear on any given page, for example through lists of content items,
or as widgets.
Placement can dispatch the shapes created by the parts of a content
item into the local zones under a given root shape that is usually
the main shape for the content item.

placement.json
--------------

The JSON file is the easiest to use, but doesn't provide quite as
much flexibility as the JavaScript file of the same name.
It can place shapes in two different ways: with specific shape names,
and with matches.
Here is an example of a `placement.json` file:

```json
{
  "matches": [
    {
      "type": "^(text|url)$", "name": "^(scope|feature|service|path|source)$",
      "path": "main", "order": "0"
    }
  ],
  "documentation-toc": {"path": "main", "order": "0"}
}
```

The `documentation-toc` property describes where the shape of the
same name should be dispatched.
Here, it will be sent to the "main" zone, at position "0".

The `matches` section enables placement to work against more
different shapes rather than a single one.
Each object under its array of matches describes one match.
Matches can be made by content item id (using the "id" attribute),
by content part type (using the "type" attribute), by display type
(using the "displayType" attribute), or by shape name (using the
"name" attribute).
Combinations of those attributes can be used, in which case all of
them must be simultaneously satisfied.
Each of the attribute values is a regular expression.

In the above example, shapes with the name "scope", "feature",
"service", "path", or "source" that were built from a text or url
part will be matched, and placed in the "main" zone at the position
"0".

placement.js
------------

A `placement.js` file is the most flexible way to place shapes.
It should export a single function that takes a "scope", a
"rootShape", and a "shapes" argument:

```js
module.exports = function placement(scope, rootShape, shapes) {
```

The code for the placement function can use the scope to resolve
services. It should look at the shapes in the shapes array
and make a decision to place each one or not.
If it decides to place a shape, it should splice it out of the
shapes array and add it somewhere under the root shape.

```js
module.exports = function placeFoo(scope, rootShape, shapes) {
  var shapeHelper = scope.require('shape');
  if (!shapes) return;
  for (var i = 0; i < shapes.length; i++) {
    var shape = shapes[i];
    var meta = shapeHelper.meta(shape);
    if (meta.type === 'foo') {
      shapeHelper.place(rootShape, 'some-zone', shape, 'after');
      shapes.splice(i--, 1);
    }
  }
}
```

In this silly example, we handle each `foo` shape and place it at the
end of the `some-zone` zone.
All other shapes are left untouched.
This example is functionally equivalent to the following
`placement.json` file:

```json
{
  "foo": {"path": "some-zone", "order": "after"}
}
```