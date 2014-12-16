// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * This handler registers itself as an Express middleware that handles
 * a catchall route with a very low priority, for content items.
 */
var ContentRouteHandler = {
  service: 'middleware',
  feature: 'content-route-handler',
  routePriority: 9000,
  scope: 'shell',
  register: function registerContentMiddleware(scope, payload) {
    payload.expressApp.register(ContentRouteHandler.routePriority, function bindContentMiddleware(app) {
      app.get('*', function contentMiddleware(request, response, next) {
        var contentRenderer = request.require('renderer');
        if (!contentRenderer) return;
        contentRenderer.promiseToRender({
          request: request,
          id: request.path,
          displayType: 'main'
        });
        next();
      });
    });
  }
};

module.exports = ContentRouteHandler;