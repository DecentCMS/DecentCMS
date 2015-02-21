title: Search

-8<------------------------------------------------------------------

The search module provides the infrastructure to build and query
search indexes, as well as a file-based implementation that is
suitable for small sites.

Querying in DecentCMS is based on a simple JavaScript API that is
loosely based on the Map/Reduce pattern.
The basic idea is that you first build an index, and then you can
run queries on those indexes.
The architecture ensures that querying can scale to very large
content stores.
It also enables querying to work in a unified way across
heterogeneous storage mechanisms.
Effectively, storage and querying are entirely separated.
