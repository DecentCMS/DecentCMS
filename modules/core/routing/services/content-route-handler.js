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
  /**
   * Registers the default content middleware.
   * @param {object} scope The scope.
   * @param {object} context The context.
   * @param {object} context.expressApp The Express application object.
   */
  register: function registerContentMiddleware(scope, context) {
    context.expressApp.register(ContentRouteHandler.routePriority, function bindContentMiddleware(app) {
      app.get('*', function contentMiddleware(request, response, next) {
        if (request.routed) {next();return;}
        var contentRenderer = request.require('renderer');
        if (!contentRenderer) {next();return;}
        contentRenderer.promiseToRender({
          request: request,
          id: request.path,
          displayType: 'main',
          place: 'main:1'
        });
        request.routed = true;
        next();
      });
    });
  },
  /**
   * Gets the URL for a regular content item (no id prefix).
   * @param {string} id The topic content item's id.
   * @returns {string} The URL for the topic.
   */
  getUrl: function getUrl(id) {
    if (id.indexOf(':') === -1) {
      return '/' + id;
    }
    return null;
  }
};

module.exports = ContentRouteHandler;