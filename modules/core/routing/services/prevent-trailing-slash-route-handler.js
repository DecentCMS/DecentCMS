// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * This handler registers itself as an Express middleware that
 * redirects all requests with a trailing slash.
 * This ensures that content items have a single URL.
 */
var PreventTrailingSlashRouteHandler = {
  service: 'middleware',
  feature: 'prevent-trailing-slash',
  routePriority: 0,
  scope: 'shell',
  register: function registerTrailingSlashMiddleware(scope, context) {
    context.expressApp.register(PreventTrailingSlashRouteHandler.routePriority, function bindTrailingSlashMiddleware(app) {
      app.get('*', function trailingSlashMiddleware(request, response, next) {
        var p = request.path;
        if (p.length > 1 && p[p.length - 1] === '/') {
          response.redirect(301, p.substr(0, p.length - 1));
        }
        next();
      });
    });
  }
};

module.exports = PreventTrailingSlashRouteHandler;