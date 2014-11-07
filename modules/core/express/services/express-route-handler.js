// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var express = require('express');
var ExpressApp = require('../lib/express-app');

/**
 * @description
 * A route handler that delegates to Express.
 * @param {object} scope The scope
 * @constructor
 */
function ExpressRouteHandler(scope) {
  var app = this.app = express();
  var expressApp = this.expressApp = new ExpressApp(app);
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

ExpressRouteHandler.prototype.handle = function expressHandle(payload, next) {
  // Handle the request (using private API for a good cause)
  this.expressApp.app.handle(payload.request, payload.response, next);
};

module.exports = ExpressRouteHandler;