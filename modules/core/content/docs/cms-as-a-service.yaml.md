title: CMS as a service
number: 4

-8<------------------------------------------------------------------

No web site should be a silo. A CMS should be great at organizing,
syndicating, and presenting your content, but it should also
communicate with arbitrary applications outside the CMS.
In particular, mobile applications should be able to use the data
from the CMS.
In DecentCMS, you can enable the `content-api` feature to expose all
content items as JSON documents.

Content items are then available under two endpoints: `src` and
`shapes`.

The first one, `src`, returns the source document for the content
item.
It is available under URLs of the form `/api/src/[id]`.
For example, you can get the source document for this topic by
navigating to
[/api/src/docs:decent-core-content/cms-as-a-service](/api/src/docs:decent-core-content/cms-as-a-service).
It's possible to get to any item this way, such as the copyright
widget on the bottom of this page:
[/api/src/widget:copyright](/api/src/widget:copyright).

Note that the formatting of the document will be a compact view, or a
pretty printed, legible version depending on whether the site is
running in release or debug mode.

The source view is useful, but doesn't always contain all the needed
information.
For example, here is the document that you'd get from
`/api/src/pages` for a query on all page content items, if such a
search page is available under the id `/pages`:

```json
{
  "meta": {
    "type": "search-page"
  },
  "title": "Pages",
  "query": {
    "indexName": "pages",
    "idFilter": "^[^:]+$",
    "map": "item.meta.type !== 'page' ? null : {title: item.title, url: item.id}",
    "orderBy": "entry.title",
    "pageSize": 10
  },
  "id": "pages"
}
```

This is useful, if you're trying to edit the query, but not so much
if you're trying to get its actual results.
This is where the second endpoint becomes useful.

Navigating to the second endpoint for the same item,
`/api/shapes/pages`, will give a document looking like this:

```json
{
  "title": {
    "meta": {
      "type": "title",
      "name": "title"
    },
    "text": "Pages"
  },
  "query-results": {
    "indexName": "pages",
    "idFilter": "^[^:]+$",
    "map": "item.meta.type !== 'page' ? null : {title: item.title, url: item.id}",
    "orderBy": "entry.title",
    "pageSize": 10,
    "meta": {
      "type": "search-results",
      "name": "query-results",
      "alternates": [
        "search-results-query",
        "search-results-pages",
        "search-results-query-pages"
      ]
    },
    "results": [
      {
        "title": "Contact",
        "url": "/contact",
        "itemId": "/contact",
        "_order": "Contact"
      },
      {
        "title": "Your CMS Expert",
        "url": "/",
        "itemId": "/",
        "_order": "Your CMS Expert"
      }
    ]
  }
}
```

This is the result of letting all shape handlers run on the content
item.

In this particular case, the title part handler, and the search part
handler each built a shape.
The search handler in particular ran the query and added its results
to its own shape.
Those results can be found under `['query-results'].results`.
