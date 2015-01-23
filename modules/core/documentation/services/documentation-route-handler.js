// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * This handler registers itself as an Express middleware that handles
 * a catchall route under /doc/* with a normal priority, for documentation
 * content items.
 */
var DocumentationRouteHandler = {
  service: 'middleware',
  feature: 'documentation',
  routePriority: 10,
  scope: 'shell',
  register: function registerDocumentationMiddleware(scope, context) {
    context.expressApp.register(DocumentationRouteHandler.routePriority, function bindDocumentationMiddleware(app) {
      app.get('/docs(/*)?', function documentationMiddleware(request, response, next) {
        if (request.routed) {next();return;}
        var contentRenderer = request.require('renderer');
        if (!contentRenderer) {next();return;}
        contentRenderer.promiseToRender({
          request: request,
          id: 'docs:' + request.path.substr(6),
          displayType: 'main'
        });
        request.routed = true;
        next();
      });
    });
  }
};

module.exports = DocumentationRouteHandler;