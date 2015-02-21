title: Routing

-8<------------------------------------------------------------------

The routing module provides core middleware, such as the content
route handler that recognizes requests for content items and routes
them to the DecentCMS pipeline.

Another middleware that it provides is the static middleware
that exposes the static assets of enabled modules and themes under
friendly URLs.

The "prevent trailing slash route handler" normalizes URLs so that
URLs ending with a trailing slash are permanently redirected to the
same URL without the slash.
This helps with ensuring that each resource is under only one URL,
which helps with search engine optimization.