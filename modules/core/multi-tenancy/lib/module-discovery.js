// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';
var fs = require('fs');
var path = require('path');
var t = require('decent-core-localization').t;

var availableModules = {};

/**
 * @description
 * Discovers modules under the paths passed as parameters. If no parameter is
 * passed in, the search is performed under /modules and /themes.
 */
function discover() {
  Array.prototype.forEach.call(
    (arguments.length === 0 ? ['./modules', './themes'] : arguments),
    function(rootPath) {
      console.log(t('Discovering module areas in %s', rootPath));
      var areaPaths = fs.readdirSync(rootPath).map(function(subPath) {
        return path.resolve(rootPath, subPath);
      });
      areaPaths.forEach(function discoverArea(areaPath) {
        var areaManifestPath = path.join(areaPath, 'package.json');
        var modulePaths;
        if (fs.existsSync(areaManifestPath)) {
          // This is a module, not a module area
          modulePaths = [areaPath];
        }
        else {
          console.log(t('Discovering modules in %s', areaPath));
          var pathStats = fs.statSync(areaPath);
          if (!pathStats.isFile()) {
            modulePaths = fs.readdirSync(areaPath).map(function(subPath) {
              return path.join(areaPath, subPath);
            });
          }
        }
        if (!modulePaths) return;
        modulePaths.forEach(function discoverModule(modulePath) {
          var manifestPath = path.join(modulePath, 'package.json');
          if (!fs.existsSync(manifestPath)) return;
          try {
            var manifest = require(manifestPath);
            var moduleName = manifest.name;
            manifest.physicalPath = path.dirname(manifestPath);
            console.log(t('Loaded module %s from %s', moduleName, manifestPath));
            availableModules[moduleName] = manifest;
            // Look for self-configuring services under /services
            if (!manifest.services) manifest.services = {};
            if (!manifest.features) manifest.features = {};
            var servicesPath = path.join(modulePath, 'services');
            try {
              var servicePaths = fs.readdirSync(servicesPath);
              for(var i = 0; i < servicePaths.length; i++) {
                var serviceFileName = servicePaths[i];
                if (path.extname(serviceFileName) === '.js') {
                  var servicePath = path.join(servicesPath, serviceFileName).slice(0, -3);
                  var service = require(servicePath);
                  var serviceName = service.service || path.basename(serviceFileName, '.js');
                  // TODO: build default feature from module name
                  var serviceFeature = service.feature;
                  var serviceDependencies = service.dependencies;
                  var serviceManifest = {
                    path: servicePath,
                    feature: serviceFeature,
                    dependencies: serviceDependencies
                  };
                  if (!manifest.services[serviceName]) {
                    manifest.services[serviceName] = [serviceManifest];
                  }
                  else {
                    manifest.services[serviceName].push(serviceManifest);
                  }
                }
              }
            }
            catch(dirEx) {}
          }
          catch(ex) {
            ex.path = manifestPath;
            ex.message = t('Failed to load %s.', manifestPath);
            throw ex;
          }
        });
      });
    });
}

module.exports = {
  discover: discover,
  modules: availableModules
};