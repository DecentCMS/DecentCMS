// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var t = require('decent-core-localization').t;

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
    payload.expressApp.register(ContentRouteHandler.routePriority, function (app) {
      app.get('*', function (request, response, next) {
        // console.log(t('Content handler handling %s', request.url));
        var contentManager = request.contentManager;
        if (!contentManager) return;
        contentManager.promiseToRender({
          request: request,
          id: request.path,
          displayType: 'main'
        });
        next();
      });
      // console.log(t('Added catch-all route for contents.'));
    });
  }
};

module.exports = ContentRouteHandler;