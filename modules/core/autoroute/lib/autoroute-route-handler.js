// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var AutorouteRouteHandler = function(shell) {
  this.shell = shell;
};

AutorouteRouteHandler.init = function(shell) {
  shell.on('decent.express.register-middleware', function(expressApp) {
    expressApp.register(AutorouteRouteHandler.manifest.priority || 9000, function (app) {
      app.get('*', function (req, res, next) {
        var contentManager = shell.require('contentManager');
        if (!contentManager) return;
        contentManager.render({
          req: payload.req,
          id: payload.req.path,
          displayType: 'main'
        });
      });
    });
  });
};

module.exports = AutorouteRouteHandler;