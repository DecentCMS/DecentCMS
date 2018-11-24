title: Feed

-8<----------------------------------------------------------------

The feed module adds routes and handlers tha serve RSS, Atom, and JSON feeds.

Routes
------

When the module is enabled, adding `/rss`, `/atom`, or `/json` at the end of a content
item's URL yields a feed of the corresponding flavor.

Mapping
-------

This becomes interesting when the content item has a `search-part`: in that case, the feed
module can automatically map the search results onto a well-formed feed.

The default mapping should be enough in most cases, as it relies on reasonable conventions
and defaults, but this can be overridden in case this is not sufficient.

## Default mappings

The default feed mapping is as follows:

```json
{
  title: item.title && item.title.text ? item.title.text : item.title ? item.title : site.name,
  description: item.body ? item.body.text : null,
  id: item.url,
  link: item.url,
  image: item.baseUrl + site.icon,
  favicon: item.baseUrl + site.favicon,
  copyright: site.copyright,
  generator: 'DecentCMS',
  author: {
    name: site.authors.join(', '),
    email: site.email
  },
  postsShapeName: 'query-results',
  postsShapeProperty: 'results'
}
```

The `postShapeName` and `postsShapeProperty` properties of the mapping defines what handled
shape to map. If this shape and property can't be found in the content zone after being handled
by the content pipeline. These defaults correspond to the shape that the `search-part` creates.

Once the feed has been mapped, each items in the results is mapped as follows:

```json
{
  title: post.title,
  id: item.baseUrl + '/' + post.url,
  link: item.baseUrl + '/' + post.url,
  description: post.summary,
  content: post.body ? post.body.text : null,
  author: {
    name: post.authors ? post.authors.join(', ') : null,
    email: post.email
  },
  date: new Date(post.date),
  image: post.image
}
```

## Overriding mappings

Any of the default mappings can be overridden with settings on the type definition or on the
content item itself.

If the content item's type definition, or the item's `meta` object has a `feedmapping` or a
`postMapping` property, its properties can define JavaScript expressions (as strings) that
override the defaults.

Overrides on items have priority over type defintion overrides, which have priority over defults.