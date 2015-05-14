title: CouchDB

-8<------------------------------------------------------------------

The CouchDB module provides CouchDB-specific implementations of
storage providers.

Configuring the CouchDB content store
-------------------------------------

The CouchDB content store can be configured under the
"couch-db-content-store" section, that can be found under "features",
in the site's settings file:

```json
"couch-db-content-store": {
  "server": "localhost",
  "port": 5984,
  "protocol": "http",
  "userVariable": "DECENT_CONSULTING_DB_USR",
  "passwordVariable": "DECENT_CONSULTING_DB_PWD",
  "database": "decent-consulting-content"
}
```

* **server** is the host name of the CouchDB server.
* **port** is the port number for the CouchDB server.
* **protocol** is "http" or "https", depending on which protocol to
  use to reach the CouchDB server.
* **userVariable** is the name of the environment variable that
  contains the CouchDB user name to use.
* **passwordVariable** is the name of the environment variable that
  contains the CouchDB password associated with the user specified by
  `userVariable`.
* **database** is the name of the CouchDB database.

A note about storage provider resolution
----------------------------------------

When DecentCMS is looking for a content item, it will ask all
implementations of the `content-store` contract to try to find it.
In most requests, several items will be queried, and stores will
search until all items have been found.
This means that the more providers are active, the more potential
performance problems will exist.
For this reason, it's recommended to keep the number of content
stores as low as possible.
