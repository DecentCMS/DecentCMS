// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * This handler registers itself as an Express middleware that handles
 * a catchall route under /docs/api/* with a normal priority, for
 * API documentation extracted from the source code of modules.
 */
var ApiDocumentationRouteHandler = {
  service: 'middleware',
  feature: 'documentation',
  routePriority: 10,
  scope: 'shell',
  register: function registerApiDocumentationMiddleware(scope, context) {
    context.expressApp.register(ApiDocumentationRouteHandler.routePriority,
      function bindApiDocumentationMiddleware(app) {
      app.get('/docs/api(/*)?', function apiDocumentationMiddleware(request, response, next) {
        if (request.routed) {next();return;}
        var contentRenderer = request.require('renderer');
        if (!contentRenderer) {next();return;}
        contentRenderer.promiseToRender({
          request: request,
          id: 'apidocs:' + request.path.substr(10),
          displayType: 'main'
        });
        request.routed = true;
        next();
      });
    });
  },
  getUrl: function getUrl(id) {
    if (id.substr(0, 8) === 'apidocs:') {
      return '/docs/api/' + id.substr(8);
    }
    return null;
  }
};

module.exports = ApiDocumentationRouteHandler;