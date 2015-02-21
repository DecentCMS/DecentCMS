// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A content enumerator that looks for documentation topics.
 */
var documentationEnumerator = {
  service: 'content-enumerator',
  feature: 'documentation',
  scope: 'shell',
  /**
   * Gets an asynchronous enumerator for all documentation topics.
   * @param {object} context The context.
   * @param {object} context.scope The scope.
   * @param {RegExp|string} [context.idFilter] A regular expression that validates
   *   content item ids before they are read and indexed.
   * @returns {Function} The function that gets the next item.
   *   It takes a callback function as its parameter
   */
  getItemEnumerator: function getDocumentationItemEnumerator(context) {
    var path = require('path');
    var fs = require('fs');
    var scope = context.scope;
    var log = scope.require('log');
    var shell = scope.require('shell');
    var modules = shell.moduleManifests;
    var docDirectories = [];
    var idFilter = typeof(context.idFilter) === 'string'
      ? new RegExp(context.idFilter)
      : context.idFilter;
    Object.getOwnPropertyNames(shell.moduleManifests)
      .forEach(function forEachModule(moduleName) {
        var manifest = modules[moduleName];
        var docPath = path.join(manifest.physicalPath, 'docs');
        if (fs.existsSync(docPath)) {
          docDirectories.push({
            name: moduleName,
            path: docPath
          });
        }
      });
    log.info("Scanning /docs for documentation topics.");
    docDirectories.unshift({
      name: '',
      path: path.resolve('docs')
    });
    var currentModule = docDirectories[0];
    var currentDir = fs.readdirSync(currentModule.path);
    var directoryIndex = 0;
    var topicIndex = 0;
    var currentPath;
    var extensions = Array.prototype.concat.apply([],
      scope.getServices('content-file-parser')
        .map(function getServiceExtensions(service) {return service.extensions;}));
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
          if (stat.isFile()
            && extensions.some(function(extension) {
              return p.substr(-extension.length) === extension})) {
            // That's a topic file.
            currentPath = p;
            topicIndex++;
            // Build the id.
            var filename = path.basename(currentPath);
            // Handle index.*
            if (filename.substr(0, 6) === 'index.') {
              filename = '';
            }
            else {
              // Remove extensions
              var dot = filename.indexOf('.');
              if (dot !== -1) {
                filename = filename.substr(0, dot);
              }
            }
            var modulePathPart = currentModule.name
              ? filename
              ? currentModule.name + '/'
              : currentModule.name
              : '';
            id = 'docs:' + (modulePathPart || '') + (filename || '');
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
        else if (directoryIndex + 1 < docDirectories.length) {
          // Look at the next directory
          directoryIndex++;
          currentModule = docDirectories[directoryIndex];
          log.info("Scanning for documentation topics.", currentModule.path);
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
          log.error('Error loading item from documentation enumerator.', err);
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