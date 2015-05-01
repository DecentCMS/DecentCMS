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
        var id = ContentRouteHandler.getId(request.path);
        response.contentType('text/html');
        contentRenderer.promiseToRender({
          request: request,
          id: id,
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
   * @param {string} id The content item's id.
   * @returns {string} The URL for the content item.
   */
  getUrl: function getUrl(id) {
    if (id.indexOf(':') === -1) {
      return id.length > 1 ? '/' + id : id;
    }
    return null;
  },
  /**
   * Gets the ID for a URL.
   * @param {string} url the URL to map.
   */
  getId: function getId(url) {
    return url
      ? url === '/'
        ? '/'
        :url.substr(1)
      : '/';
  }
};

module.exports = ContentRouteHandler;