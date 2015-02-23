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
  feature: 'api-documentation',
  routePriority: 10,
  scope: 'shell',
  /**
   * Registers the API documentation middleware.
   * @param {object} scope The scope.
   * @param {object} context The context.
   * @param {object} context.expressApp The Express application object.
   */
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
          displayType: 'main',
          place: 'main:1'
        });
        request.routed = true;
        next();
      });
    });
  },
  /**
   * Gets the URL for an API documentation topic (id prefix 'apidocs:').
   * @param {string} id The topic content item's id.
   * @returns {string} The URL for the topic.
   */
  getUrl: function getUrl(id) {
    if (id.substr(0, 8) === 'apidocs:') {
      return '/docs/api/' + id.substr(8);
    }
    return null;
  }
};

module.exports = ApiDocumentationRouteHandler;