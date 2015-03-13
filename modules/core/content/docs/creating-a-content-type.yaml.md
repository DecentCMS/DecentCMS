title: Creating a content type
number: 3

-8<------------------------------------------------------------------

A content item in DecentCMS is an aggregate of parts, as defined by
the content type of the item.
For example, an item of type "page" is the combination of a title
part, and a body part.
This definition of which parts constitute a given type is
configuration data that is defined at the level of the site.

If you open the `settings.json` file at the root of a site's folder,
you'll find that content type definitions are part of the
configuration of the "content" feature.
More precisely, under `features.content.types`:

```json
{
  "name": "DecentCMS",
  "host": ["decentcms.org", "local.decentcms.com"],
  "port": "*",
  "setup": true,
  "features": {
    "content": {
      "types": {
        "page": {
```

The type definition itself has a list of named parts, and their
corresponding part types:

```json
"page": {
  "name": "Page",
  "description": "A simple page type.",
  "parts": {
    "title": {
      "type": "title"
    },
    "body": {
      "type": "text"
    }
  }
}
```

It is possible, if necessary, to have other settings than the part's
type under a part definition.

Any service can access the type definition object through the content
manager:

```js
var cm = this.scope.require('content-manager');
var typeDefinition = cm.getType(someItem);
var bodyDefinition = typeDefinition.parts.body;
```

The content manager also has a helper method for getting the names of
all the parts of a given type:

```js
var textPartNames = cm.getParts(someItem, 'text');
```
