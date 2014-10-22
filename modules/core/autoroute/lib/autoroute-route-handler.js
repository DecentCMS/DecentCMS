// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var AutorouteRouteHandler = function(shell) {
  this.shell = shell;
};

AutorouteRouteHandler.on = {
  'decent.express.register-middleware': function(shell, expressApp) {
    expressApp.register(AutorouteRouteHandler.manifest.priority || 9000, function (app) {
      app.get('*', function (req, res, next) {
        var contentManager = req.contentManager;
        if (!contentManager) return;
        contentManager.render({
          req: req,
          id: req.path,
          displayType: 'main'
        });
      });
    });
  }
};

module.exports = AutorouteRouteHandler;