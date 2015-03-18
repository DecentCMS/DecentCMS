title: Writing a content part
number: 6

-8<------------------------------------------------------------------

A content part is a reusable piece of content that can be composed
with other parts into a content type.
For example, a blog post content type could be built by composing a
title part, a text part for the post's body, a tags part, and a list
of comments.

DecentCMS comes with a few parts built-in, such as title and text,
but it's easy to write your own.

[Creating your own content type][content-type] can be done by adding
it to the configuration of the "content" feature in the site's
`settings.json` file.
You may also alter an existing content type and add new parts to it.

In this topic, we'll use the example of a rudimentary tags part.
The part will expose a list of tags, which are simple strings.

Here's a definition of the `page` content type, modified to include
the new part:

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
    },
    "tags": {
      "type": "tags"
    }
  }
}
```

In the document for a content item that has this part, it will be
stored as follows:

```json
"tags": ["CMS", "DecentCMS", "Content part"]
```

If the content item just has this extra property, and no code does
anything with it, nothing will change.
The first bit of code we have to write is a shape handler service.
When the content item gets added to the page, it's in the form of
a "content" shape.
DecentCMS will then make a call to all "shape-handler" services,
that can then decide to handle properties of the content item and
add its own shapes under the "content" shape.
In the case of the tags part, we're going to base that decision on
the type definition, only handling properties of type "tags".
The following `tags-part.js` file should be placed under the
`services` directory of your module.

```js
'use strict';

/**
 * The tags part handler creates tags shapes from tags parts.
 */
var TagsPart = {
  feature: 'sample-tags',
  service: 'shape-handler',
  /**
   * Adds a tags shape to `context.shape.temp.shapes` for each tags
   * part on the content item.
   * @param {object} context The context object.
   * @param {object} context.shape
   * The shape to handle. Its `temp.item` is a reference to the content item.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleTagsPart(context, done) {
    var content = context.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp) return done();
    var temp = content.temp;
    var item = temp.item;
    var scope = context.scope;
    var contentManager = scope.require('content-manager');
    var tagsParts = contentManager.getParts(item, 'tags');
    for (var i = 0; i < tagsParts.length; i++) {
      var partName = tagsParts[i];
      var part = item[partName];
      if (!part) continue;
      temp.shapes.push({
        meta: {
          type: 'tags',
          name: partName,
          alternates: ['tags-' + partName],
          item: item
        },
        temp: {displayType: temp.displayType},
        tags: part || []
      });
    }
    done();
  }
};

module.exports = TagsPart;
```

The code first checks the type of the shape currently being handled.
If it's not "content", it just calls `done`.
If it is, it gets the content manager and asks it to find the list of
parts of type "tags".
It then loops over those, and adds a `tags` shape for each tags part.

We're almost done: the handler creates shapes for each tags part, now
we need to place these parts, and render them.

Default placement for the parts shape can be defined from the
`placement.json` file at the root of your module:

```json
"tags": {"path": "main", "order": "after"}
```

This places the tags shape last in the `main` zone.

Finally, we need a default template for the part.
We're going to use the JavaScript view engine for this.
The following `views/tags.js` template will render the list of tags
as a `ul/li` structure:

```js
'use strict';

module.exports = function tagsTemplate(tagsPart, renderer, done) {
  renderer.startTag('ul');
  tagsPart.tags.forEach(function(tag) {
    renderer.tag('li', tag);
  }
  renderer.endTag();
  done();
};
```

  [content-type]: /docs/decent-core-content/creating-a-content-type