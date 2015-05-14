// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';
var fs = require('fs');
var path = require('path');

/**
 * @description
 * Discovers modules under the paths passed as parameters. If no parameter is
 * passed in, the search is performed under /modules and /themes.
 */
function discover() {
  var availableModules = {};
  var areas = {};
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
            // Remember that this is an area
            areas[areaPath] = path.basename(areaPath);
            // Scan for modules
            modulePaths = fs.readdirSync(areaPath).map(function(subPath) {
              return path.join(areaPath, subPath);
            });
          }
        }
        if (!modulePaths) return;
        modulePaths.forEach(function discoverEachModule(modulePath) {
          discoverModule(modulePath, availableModules, areas);
        });
      });
    });
  return availableModules;
}

/**
 * Discovers the module under a path.
 * @param {string} modulePath The path of the module's directory.
 * @returns {object} The manifest of the module.
 * @param {object} availableModules Available modules will be added to this object.
 * @param {object} [areas] A map of area paths to area folder names.
 */
function discoverModule(modulePath, availableModules, areas) {
  areas = areas || {};
  var manifestPath = path.join(modulePath, 'package.json');
  if (!fs.existsSync(manifestPath)) return null;
  var manifest = require(manifestPath);
  var moduleName = manifest.name;
  manifest.physicalPath = path.dirname(manifestPath);
  manifest.area = areas[path.dirname(manifest.physicalPath)] || null;
  availableModules[moduleName] = manifest;
  // Look for self-configuring services under /services
  if (!manifest.services) manifest.services = {};
  if (!manifest.features) manifest.features = {};
  var servicesPath = path.join(modulePath, 'services');
  if (!fs.existsSync(servicesPath)) return manifest;
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
      var serviceFeature = service.feature || path.basename(serviceFileName, '.js');
      var serviceDependencies = service.dependencies || null;
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
  return manifest;
}

module.exports = {
  discover: discover,
  discoverModule: discoverModule
};