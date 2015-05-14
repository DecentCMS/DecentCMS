title: Search

-8<------------------------------------------------------------------

The search module provides the infrastructure to build and query
search indexes, as well as a file-based implementation that is
suitable for small sites.

Querying in DecentCMS is based on a simple JavaScript API that is
loosely based on the map/reduce pattern.
The basic idea is that you first build an index, and then you can
run queries on that index.
The architecture ensures that querying can scale to very large
content stores.
It also enables querying to work in a unified way across
heterogeneous storage mechanisms.
Effectively, storage and querying are entirely separated.

It is possible to create and query a search index from code, like
`documentation-toc-part` is doing, but there is also a ready-to-use
content part that makes simple querying really easy: `search-part`.

The search API
--------------

In order to perform a search, an index has first to be created.
An index is defined by three things:

* An optional **id filter**

  This is your first and most efficient way to filter out content
  items.
  It's a regular expression that will be tested against the id of the
  content items.
  If it tests negatively, the content item won't even be fetched from
  the store.
  
* A **mapping** function

  This is a JavaScript function that maps a content item onto one or
  several index entries.
  It's the rough equivalent of a `SELECT` in SQL: it defines what
  properties will be available on the index entries, the same way
  that a SQL `SELECT` specifies what columns will be available on the
  rows of the result set.
  A big difference however is that the mapping function may decline
  to return an entry for some items, and can return more than one if
  necessary.
  In that sense, it's also a little bit of a `WHERE`.
  
* An **order** function

  This is a JavaScript function that maps an index entry onto one or
  more values by which the index should be sorted.
  It is the equivalent of SQL's `ORDER BY`.
  The return type of this function can be a simple JavaScript
  comparable value (string, number, Date), or it can be an array of
  such values.
  If an array is returned, each value in the array will be used, one
  after the other.
  As soon as a comparison gives a non-equal result, it is considered
  done and the exploration of the array is stopped.
  
From those three things, an index can be built by the search module
by scanning each content item in the system, no matter where it is
stored.

The index will be pre-sorted, and pre-filtered by both the id filter,
and the logic in the mapping function.
The index doesn't need to be rebuilt as long as the content items
don't change.
When a content item changes, it is possible to update the index by
running the id filter and the mapping function on just this item,
and by using the order by function to figure out where to change
index entries.

This makes the system fast on querying, and a little slower on write
operations, as all indexes in the system potentially need to be
updated in such a case.
The index updates can be performed asynchronously in the background,
however, which mitigates the issue.

An index is built by requiring an `index` service from the scope, and
then calling [getIndex][get-index] on it.
An optional name can be given to the index, and it is recommended
that you do so.
Otherwise, a name is generated from the filter, map, and order
function source code, which is harder to maintain.

The [getIndex][get-index] function returns an object that you can use
to query the index.
Until the index has had time to be built, querying a given index will
return empty results.
This is because indexing can take a very long time, depending on the
number of items in the system, so even an asynchronous operation
would delay the response to the user by too much.

As soon as the index has been built, the querying API will return
actual result sets.

There are two ways an index can be queried: using `filter`, or using
`reduce`.

Filter can be used to obtain a paginated list of index entries.
It can take an optional `where` function that can specify what index
entries should be in the result set.
Remember that this condition will need to be run on potentially all
index entries.
For this reason, if you can, you should integrate such conditions
into the mapping function, moving the burden of filtering to be run
only once during the indexing phase rather than running it every time
when querying.

Reduce applies an aggregating function on the index entries.
Reduce can take an optional `where` function, with the same caveats
that were mentioned in the previous paragraph.

This map/reduce model of querying may seem strange if you are used to
querying databases using SQL.
It is however not harder to use than SQL, and brings some unique
advantages to a CMS:

* It can query heterogeneously stored items, such as database-bound
  items, API documentation extracted from JavaScript source files, or
  JSON files on disk, in one operation.
* It can then present the results in a unique, homogeneous view.
  It can also be easily scaled out: data stores and indexes can be
  sharded and spread across multiple servers, without changing the
  API.

An implementation of an index, as well as the standard API that all
index implementations must expose, can be found under this topic:

[/docs/api/decent-core-search/file-index](/docs/api/decent-core-search/file-index)

Example: Creating a paginated list of API documentation topics
--------------------------------------------------------------

We'll assume here that the site that we're working on has the
`api-documentation` feature enabled, so that the topics we want to
display actually exist.

The `search-part` feature must also be enabled on the site, as well
as the `query` feature, and an implementation of the `index` service,
such as the one in the `file-index` feature.

In order to create a page that shows a list of query results, we'll
first create a new content type that has a title, and a search part.

Here is the type definition, as defined in the site's settings file,
under `features.content.types`:

```json
"search-page": {
  "name": "Search Results Page",
  "description": "Displays the results of a search.",
  "parts": {
    "title": {
      "type": "title"
    },
    "query": {
      "type": "search"
    }
  }
}
```

We can now create a new `api-doc-topics.json` file under the site's
`content` folder:

```json
{
  "meta": {
    "type": "search-page"
  },
  "title": "API Documentation Topics",
  "query": {
    "indexName": "api-doc-topics",
    "idFilter": "^apidocs:.+$",
    "map": "{title: item.title, url: '/docs/api/' + item.id.substr(8)}",
    "orderBy": "entry.itemId",
    "pageSize": 10,
    "displayPages": true,
    "displayNextPrevious": true,
    "displayFirstLast": true
  }
}
```

You can now hit the `/api-doc-topics` URL to see your search results.
The first time you hit the page, nothing will get displayed, as the
index has not yet been built.
Hitting the page after the index has finished building itself
displays the paginated list of topics.

Notice how an id filter is used to select only API documentation
topics, without having to load the items.
This is the most efficient way to exclude items from the index, and
as such should be used as much as possible.

The mapping expression copies the title and URL of the item into
index entries.
The search part doesn't require that you write entire function like
the API does.
Instead, a simple expression can be used, that will be wrapped into a
function automatically.

Similarly, the `orderBy` property is just an expression.
Here, we sort by item id.
Notice that we never mapped that `itemId` property.
This is because the system always adds the id of the item that was
used to build an index entry, automatically.

The results of the query will be displayed by one or two shapes:

* a `search-results` shape, that has a `results` property that is
  the results of the `filter` or `reduce` operation.
  This shape has `search-results-[part name]`,
  `search-results-[index name]`, and
  `search-results-[part name]-[index name]` alternates, that can be
  used to customize the rendering of search results.
  
* a `pagination` shape, if pagination is active.
  This shape has three alternates built on the same pattern as the
  `search-results` alternates.

The search part is a convenient and simple way of querying the CMS,
and of displaying the results.
The reference documentation for it can be found in this topic:

[/docs/api/decent-core-search/search-part](/docs/api/decent-core-search/search-part)

  [get-index]: /docs/api/decent-core-search/index
