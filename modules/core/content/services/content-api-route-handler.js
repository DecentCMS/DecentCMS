// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * This handler registers itself as an Express middleware that handles
 * a catchall route with a relatively low priority, for content API.
 */
var ContentApiRouteHandler = {
  service: 'middleware',
  feature: 'content-api',
  routePriority: 8000,
  scope: 'shell',
  /**
   * Registers the default content API middleware.
   * @param {object} scope The scope.
   * @param {object} context The context.
   * @param {object} context.expressApp The Express application object.
   */
  register: function registerContentApiMiddleware(scope, context) {
    context.expressApp.register(ContentApiRouteHandler.routePriority, function bindContentMiddleware(app) {
      app.get('/api(/*)?', function contentMiddleware(request, response, next) {
        if (request.routed) {next();return;}
        var id = request.path === '/api' ? '/' : require('querystring').unescape(request.path.substr(5));
        response.type('json');
        if (id) {
          var storage = request.require('storage-manager');
          storage.promiseToGet(id);
          storage.fetchContent({}, function () {
            var item = storage.getAvailableItem(id);
            if (item) {
              delete item.temp;
              response.send(item);

              request.routed = true;
              request.handled = true;
              next();
            }
            else {
              response.status(404);
              response.send({error: 'Not found'});

              request.routed = true;
              request.handled = true;
              next();
            }
          });
        }
      });
    });
  }
};

module.exports = ContentApiRouteHandler;