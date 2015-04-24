// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: add some config settings, in particular for compression, that is for the moment globally turned on.

/**
 * @description
 * A route handler that delegates to Express.
 * @param {object} scope The scope
 * @constructor
 */
function ExpressRouteHandler(scope) {
  var express = require('express');
  var compression = require('compression');
  var ExpressApp = require('../lib/express-app');

  var app = this.app = express();
  app.use(compression());
  var expressApp = this.expressApp = new ExpressApp(app, scope);
  scope.register('express-app', expressApp);
  scope.register('express', express);
  if (!expressApp.locked) {
    // Register middleware now.
    var middleware = scope.getServices('middleware');
    for (var i = 0; i < middleware.length; i++) {
      middleware[i].register(scope, {
        expressApp: expressApp,
        express: express
      });
    }
    expressApp.lock();
  }
}
ExpressRouteHandler.service = 'route-handler';
ExpressRouteHandler.feature = 'express';
ExpressRouteHandler.isScopeSingleton = true;
ExpressRouteHandler.scope = 'shell';

/**
 * Handles a request by passing it over to the Express pipeline.
 * @param {object} context The context.
 * @param {IncomingMessage} context.request The request.
 * @param {ServerResponse} context.response The response.
 * @param {Function} next The callback.
 */
ExpressRouteHandler.prototype.handle = function expressHandle(context, next) {
  // Handle the request (using private API for a good cause)
  this.expressApp.app.handle(context.request, context.response, next);
};

module.exports = ExpressRouteHandler;