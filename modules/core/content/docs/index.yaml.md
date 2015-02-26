title: Content

-8<----------------------------------------------------------------

The core content module provides basic content management services.

Content type system
-------------------

A flexible and dynamic type system is the foundation of a good CMS.
DecentCMS builds its type system around the idea of composition,
using the concepts of content types, content items, and content
parts.

### Content items

Content items are the atoms of your site. They are the smallest
pieces of content that can be considered independent and
consistent entities.

A page, a product, or a blog post are examples of content items.

### Content parts

Content items are built from content parts, which are logical units
of content.
Content parts typically contain one or several properties that
together fulfil a particular role.

Examples of parts could be the title, a list of tags, a list of
comments, or a set of geographical coordinates.

In each of these cases, a part has an easy to identify role, and
one can imagine how parts can be composed in different manners to
build different content types.

A blog post, for example, could be built from a title, a permalink,
a body, a list of tags, an author, a publication date,
and a list of comments.

```json
{
  "title": "The DecentCMS content type system",
  "slug": "the-blog/the-decentcms-content-type-system",
  "body": "The content type system in DecentCMS...",
  "tags": ["DecentCMS", "Node.js", "CMS"],
  "author": "bleroy",
  "created": "2015-02-24T04:57:56+00:00",
  "published": "2015-02-24T04:57:56+00:00",
  "comments": [
    {
      "author": "Some guy",
      "published": "2015-02-24T06:00:32+00:00",
      "body": "Cool stuff."
    }
  ],
  "blog": "blog:the-blog",
  "meta": {"type": "blog-post"}
}
```

There may be conventions on the name of some parts.
For example, the part called "title" behaves in a very specific way,
which is that a special piece of code called a part handler will
pick-up the value under title and use it to build the &lt;title/&gt;
tag for the page.
Other than these conventions, the name of a part can be freely chosen.

Note that part values can be simple types such as strings when that
makes sense, or they can be complex objects when that’s necessary.
The same part can even take different forms based on the
circumstances.

For example, whereas the above post’s body part is a simple string,
here is what the body part of the decentcms.org home page looks like:

```json
"body": {
  "src": "../../../README.md"
}
```

As you can see, the body part of that page may still be the same
text part as the one on the blog post type, but instead of being
stored as a simple string, it is an object that points to a Markdown
file.
This is useful in this case in order to re-use the project’s
README.md file that is at the root of the project.
This should illustrate the great flexibility of this type system,
and its ability to adapt to interesting new cases.

To continue with our atomic analogy, if the content item is an atom,
parts would be the protons and neutrons that form the nucleus.
In the same way that atoms and their chemical properties can be
classified according to the composition of their nucleus, content
items can be assigned a type that represents all items that are
built from the same arrangement of parts.

### Content types

Content types are specific combinations of parts, with specific
settings for each of those parts.
Once a type has been defined, content items of that type can be
created.
A content type is a set of named parts, with optional settings for
each of those parts.

Here is a possible JSON description of a blog post content type:

```json
{
  "blog-post": {
    "name": "Blog post",
    "description": "Blog post",
    "parts": {
      "title": {"type": "title"},
      "slug": {
        "type": "slug",
        "pattern": "{{blog.slug}}/{{slugify(title)}}"
      },
      "body": {
        "type": "text",
        "flavor": "markdown"
      },
      "tags": {
        "type": "taxonomy",
        "taxonomyId": "taxonomy:tags",
        "multiple": true
      },
      "author": {"type": "user"},
      "comments": {"type": "comments"},
      "blog": {
        "type": "content-item",
        "related-type": "blog"
      }
    }
  }
}
```

### Identity

All content items have a unique string id in the system.
In the case of content items that have a public URL, that id is
usually the very URL of the item relative to the root of the site.

Some kinds of items have an id prefix that is an identifier followed
with a colon.
For example, widgets are identified by strings of the form:
`widget:name-of-the-widget`.
