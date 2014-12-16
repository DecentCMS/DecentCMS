// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var path = require('path');
var fs = require('fs');

/**
 * @description
 * This handler registers itself as an Express middleware that handles
 * routes for static files.
 */
var StaticRouteHandler = {
  service: 'middleware',
  feature: 'static-route-handler',
  routePriority: 0,
  scope: 'shell',
  register: function registerStaticRoutesMiddleware(scope, payload) {
    var express = payload.express;
    payload.expressApp.register(StaticRouteHandler.routePriority, function bindStaticMiddleware(app) {
      var modules = scope.modules;
      var modulePaths = modules.map(function mapModuleToPath(moduleName) {
        return scope.moduleManifests[moduleName].physicalPath;
      });
      var staticFolders = scope.staticFolders;
      var log = scope.require('log');
      // Register a static route for each existing static folder in each module
      for (var i = 0; i < modulePaths.length; i++) {
        for (var j = 0; j < staticFolders.length; j++) {
          var physicalPath = path.join(modulePaths[i], staticFolders[j]);
          if (!fs.existsSync(physicalPath)) continue;
          var url = '/' + staticFolders[j];
          app.use(url, express.static(physicalPath));
          log.verbose('Added static file route.', {path: physicalPath});
        }
      }
      // Also, register a /favicon.ico route in case the theme doesn't do things correctly
      var faviconPath = path.resolve('./favicon.ico');
      app.use('/favicon.ico', express.static(faviconPath));
      log.verbose('Added static favicon.ico route.', {path: faviconPath});
    });
  }
};

module.exports = StaticRouteHandler;