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
DecentCMS will then make a call to all `shape-handler` services,
that can then decide to handle properties of the content item and
add its own shapes under the "content" shape.
Shape handlers can decide to act on any shape, but most handlers act
only on a specific type of part.
There is an easier way to build this type of handler, that eliminates
most of the boilerplate code that would otherwise be necessary.
Instead of implementing a `shape-handler` service, we're going to
implement a `tags-part-handler`.
The following `tags-part.js` file should be placed under the
`services` directory of your module.

```js
'use strict';

/**
 * The tags part handler creates tags shapes from tags parts.
 */
var TagsPart = {
  feature: 'sample-tags',
  service: 'tags-part-handler',
  /**
   * Adds a tags shape to `context.shapes` for the tags part on the context.
   * @param {object} context The context object.
   * @param {object} context.part The tags part to handle.
   * @param {string} context.partName The name of the part.
   * @param {string} context.displayType The display type.
   * @param {object} context.item A reference to the content item.
   * @param {Array} context.shapes The shapes array to which new shapes must be pushed.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleTagsPart(context, done) {
    var shapes = context.shapes;
    // No sense in doing anything if there isn't a shapes collection to output to.
    if (!shapes) {done();return;}
    // Push a new shape for this part.
    var part = context.part;
    shapes.push({
      meta: {
        type: 'tags',
        name: context.partName,
        alternates: ['tags-' + context.partName],
        item: context.item
      },
      temp: {displayType: context.displayType},
      tags: part || []
    });
    done();
  }
};

module.exports = TagsPart;
```

The code first checks that there is a collection of shapes to add new
ones to.
If there isn't, it just calls `done`.
Otherwise, it just pushes a new shape that has the part itself (which
is just an array of strings) as its `tags` property.
We're almost done: the handler created shapes for each tags part, now
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