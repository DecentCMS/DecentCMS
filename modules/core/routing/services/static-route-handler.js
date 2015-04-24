// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
// TODO: modules register their own static folders, instead of having the site decide for all.
// TODO: let sites register their own style sheets.

var path = require('path');
var fs = require('fs');

/**
 * @description
 * This handler registers itself as an Express middleware that handles
 * routes for static files. It scans enabled modules and themes for folders
 * with the configured names, and exposes their contents under a common
 * route that is user-friendly and enables for easily overriding static
 * resources.
 *
 * For example, if a module exposes a 'css/style.css' file this way, the file
 * will be available under the URL '/css/style.css' and can be referenced as
 * such in view templates. If another module or theme exposes the same file,
 * dependency order and priorities will determine what file gets served.
 *
 * A `/favicon.ico` route also gets registered in case the theme's layout
 * doesn't properly specify a favicon. The default DecentCMS icon at the
 * root of the application gets served by this route.
 *
 * The handler can be configured for each site through its `settings.json`
 * file:
 *
 *     "static-route-handler": {
 *        "staticFolders": ["css", "js", "img", "fonts"],
 *        "mediaFolder": "media"
 *     }
 *
 * The `staticFolders` property specifies what folders will get exposed as static
 * resource folders.
 *
 * The `mediaFolder` property specifies what folder under the site's folder
 * will be exposed as site-specific static assets.
 */
var StaticRouteHandler = {
  service: 'middleware',
  feature: 'static-route-handler',
  routePriority: 0,
  scope: 'shell',
  /**
   * Registers the static route middleware.
   * @param {object} scope The scope.
   * @param {object} context The context.
   * @param {object} context.expressApp The Express application object.
   */
  register: function registerStaticRoutesMiddleware(scope, context) {
    var express = context.express;
    context.expressApp.register(StaticRouteHandler.routePriority, function bindStaticMiddleware(app) {
      var modules = scope.modules;
      var modulePaths = modules.map(function mapModuleToPath(moduleName) {
        return scope.moduleManifests[moduleName].physicalPath;
      });
      var featureSettings = scope.settings[StaticRouteHandler.feature];
      var staticFolders = featureSettings.staticFolders;
      var maxAge = featureSettings.maxAge || 24*60*60*1000; // 1 day by default
      var log = scope.require('log');
      // Register a static route for each existing static folder in each module
      for (var i = 0; i < modulePaths.length; i++) {
        for (var j = 0; j < staticFolders.length; j++) {
          var physicalPath = path.join(modulePaths[i], staticFolders[j]);
          if (!fs.existsSync(physicalPath)) continue;
          var url = '/' + staticFolders[j];
          app.use(url, express.static(physicalPath, {maxAge: maxAge}));
          log.verbose('Added static file route.', {url: url, path: physicalPath});
        }
      }
      // Register a static route for the site's media folder
      var mediaFolder = featureSettings.mediaFolder;
      if (mediaFolder) {
        var mediaPath = path.join(scope.rootPath, mediaFolder);
        app.use('/media', express.static(mediaPath, {maxAge: maxAge}));
        log.verbose('Added media static file route.', {path: mediaPath});
      }
      // Also, register a /favicon.ico route in case the theme doesn't do things correctly
      var faviconPath = path.resolve(scope.rootPath, 'favicon.ico');
      if (!fs.existsSync(faviconPath)) {
        faviconPath = path.resolve('./favicon.ico');
      }
      app.use('/favicon.ico', express.static(faviconPath, {maxAge: maxAge}));
      log.verbose('Added static favicon.ico route.', {path: faviconPath});
    });
  }
};

module.exports = StaticRouteHandler;