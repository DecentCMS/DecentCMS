// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * This handler registers itself as an Express middleware that handles
 * a catchall route with a very low priority, for content items.
 * @param {Shell} shell The tenant.
 * @constructor
 */
var AutorouteRouteHandler = {
  feature: 'autoroute',
  dependencies: ['decent-core-express'],
  routePriority: 9000,
  scope: 'shell',
  on: {
    'decent.express.register-middleware': function(shell, expressApp) {
      expressApp.register(AutorouteRouteHandler.routePriority, function (app) {
        app.get('*', function (request) {
          var contentManager = request.contentManager;
          if (!contentManager) return;
          contentManager.promiseToRender({
            req: request,
            id: request.path,
            displayType: 'main'
          });
        });
      });
    }
  }
};

module.exports = AutorouteRouteHandler;