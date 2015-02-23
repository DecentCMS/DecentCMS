title: Documentation

-8<------------------------------------------------------------------

The documentation module discovers documentation topics from all
enabled modules, and also generates documentation topics from JsDoc
comments in source files.

Warning
-------

The API documentation feature from this module will not run properly
on IISNode, and in particular on Azure.
A workaround to host a DecentCMS documentation site that shows API
documentation on Azure or other IIS host is to deploy the cached
versions that are under the /cache directory of this module after
all the API content has been read on a server other than IIS.
The technical reason for that is that the jsdoc-parse module that
is used to parse JsDoc comments in code uses process.stdin, an API
that is not available on IIS.