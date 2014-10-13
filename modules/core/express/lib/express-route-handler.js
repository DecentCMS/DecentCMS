// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var ExpressApp = require('./express-app');

/**
 * @description
 * A route handler that delegates to Express.
 * @param {Shell} shell The shell
 * @constructor
 */
var ExpressRouteHandler = function(shell) {
  this.shell = shell;
};

ExpressRouteHandler.isShellSingleton = true;

/**
 * @description
 * Creates the Express app, adds it as a shell service,
 * calls for registration, then locks the app and wires up
 * the route handling event.
 * @param shell
 */
ExpressRouteHandler.init = function(shell) {
  var express = require('express');
  var app = express();
  var expressApp = new ExpressApp(app);
  shell.services['express-app'] = [expressApp];
  shell.emit('decent.express.register-middleware', expressApp);
  expressApp.lock();
  shell.on(shell.handleRouteEvent, function(payload) {
    expressApp.app.handle(req, res);
  });
};

module.exports = ExpressRouteHandler;