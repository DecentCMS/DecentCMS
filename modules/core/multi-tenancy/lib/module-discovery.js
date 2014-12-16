// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';
var fs = require('fs');
var path = require('path');

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
          var manifest = require(manifestPath);
          var moduleName = manifest.name;
          manifest.physicalPath = path.dirname(manifestPath);
          availableModules[moduleName] = manifest;
          // Look for self-configuring services under /services
          if (!manifest.services) manifest.services = {};
          if (!manifest.features) manifest.features = {};
          var servicesPath = path.join(modulePath, 'services');
          if (!fs.existsSync(servicesPath)) return;
          var servicePaths = fs.readdirSync(servicesPath);
          for(var i = 0; i < servicePaths.length; i++) {
            var serviceFileName = servicePaths[i];
            if (path.extname(serviceFileName) === '.js') {
              var servicePath = path.join(servicesPath, serviceFileName).slice(0, -3);
              var service = require(servicePath);
              // Check that the service declares its scope
              if (typeof(service.scope) !== 'string') {
                service.scope = 'shell';
              }
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
        });
      });
    });
}

module.exports = {
  discover: discover,
  modules: availableModules
};