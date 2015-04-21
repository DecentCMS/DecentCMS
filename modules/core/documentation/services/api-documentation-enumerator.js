// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A content enumerator that looks for API documentation extracted from source files.
 */
var documentationEnumerator = {
  service: 'content-enumerator',
  feature: 'api-documentation',
  scope: 'shell',
  /**
   * Gets an asynchronous enumerator for all API documentation topics.
   * @param {object} context The context.
   * @param {object} context.scope The scope.
   * @param {RegExp|string} [context.idFilter] A regular expression that validates
   *   content item ids before they are read and indexed.
   * @returns {Function} The function that gets the next item.
   *   It takes a callback function as its parameter
   */
  getItemEnumerator: function(context) {
    var path = require('path');
    var fs = require('fs');
    var scope = context.scope;
    var log = scope.require('log');
    var shell = scope.require('shell');
    var modules = shell.moduleManifests;
    var moduleNames = Object.getOwnPropertyNames(shell.moduleManifests);
    var allDirectories = [];
    var idFilter = typeof(context.idFilter) === 'string'
      ? new RegExp(context.idFilter)
      : context.idFilter;
    moduleNames.forEach(function forEachModule(moduleName) {
      var manifest = modules[moduleName];
      var libPath = path.join(manifest.physicalPath, 'lib');
      if (fs.existsSync(libPath)) {
        allDirectories.push({
          name: moduleName,
          path: libPath
        });
      }
      var servicesPath = path.join(manifest.physicalPath, 'services');
      if (fs.existsSync(servicesPath)) {
        allDirectories.push({
          name: moduleName,
          path: servicesPath
        });
      }
    });
    var currentModule = allDirectories[0];
    var currentDir = fs.readdirSync(currentModule.path);
    var directoryIndex = 0;
    var topicIndex = 0;
    var currentPath;
    /**
     * Looks for the next item in the store.
     * @param {Function} callback the function that gets called
     *   when the item has been fetched.
     *   This function takes an error object and the item as its
     *   parameters. When all items have been enumerated, the
     *   callback is called without parameters.
     */
    var getNextItem = function getNextItem(callback) {
      var found = false;
      var p, id;
      currentPath = null;
      // Look for next content file.
      while (!found) {
        if (topicIndex < currentDir.length) {
          p = path.join(currentModule.path, currentDir[topicIndex]);
          var stat = fs.statSync(p);
          if (stat.isFile() && p.substr(-3) === '.js') {
            // That's a source file.
            currentPath = p;
            topicIndex++;
            // Build the id
            var filename = path.basename(currentPath);
            filename = filename.substr(0, filename.length - 3);
            id = 'apidocs:' + currentModule.name + '/' + filename;
            // Check the id against idFilter
            if (idFilter && !idFilter.test(id)) {
              continue;
            }
            found = true;
          }
          else {
            // Try the next entry.
            topicIndex++;
          }
        }
        else if (directoryIndex + 1 < allDirectories.length) {
          // Look at the next directory
          directoryIndex++;
          currentModule = allDirectories[directoryIndex];
          log.info("Scanning for API documentation topics.", currentModule.path);
          currentDir = fs.readdirSync(currentModule.path);
          topicIndex = 0;
        }
        else {
          break;
        }
      }
      if (!found) {
        // Call back one last time.
        callback();
        return;
      }
      // Fetch the item.
      var itemsToFetch = {};
      itemsToFetch[id] = [];
      var loadContext = {
        scope: scope,
        itemsToFetch: itemsToFetch,
        items: {}
      };
      scope.callService('content-store', 'loadItems', loadContext, function(err) {
        if (err) {
          log.error("Error loading item from API documentation enumerator.", err);
          callback(err);
          return;
        }
        var item = loadContext.items[id];
        callback(null, item);
      });
    };
    return getNextItem;
  }
};

module.exports = documentationEnumerator;