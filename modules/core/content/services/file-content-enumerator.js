// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A content enumerator that looks for content files in the site's content folder.
 */
var fileContentEnumerator = {
  service: 'content-enumerator',
  feature: 'file-content-store',
  scope: 'shell',
  /**
   * Gets an asynchronous enumerator for all the items in the store.
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

    var sepExp = new RegExp(path.sep.replace(/\\/g, '\\\\'), 'g');

    var scope = context.scope;
    var idFilter = typeof(context.idFilter) === 'string'
      ? new RegExp(context.idFilter)
      : context.idFilter;
    var shell = scope.require('shell');
    var siteRoot = path.resolve(shell.rootPath, 'content');
    var currentDirPath = siteRoot;
    var currentDir = fs.readdirSync(siteRoot);
    var i = 0;
    var currentPath;
    var extensions = Array.prototype.concat.apply([],
      scope.getServices('content-file-parser')
        .map(function (service) {
          return service.extensions || [];
        }));
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
      // Look for next content file.
      while (!found) {
        if (i < currentDir.length) {
          p = path.join(currentDirPath, currentDir[i]);
          var stat = fs.statSync(p);
          if (stat.isDirectory()) {
            // Look into that directory.
            currentDirPath = p;
            currentDir = fs.readdirSync(p);
            i = 0;
          }
          else if (stat.isFile()
            && extensions.some(function (extension) {
              return p.substr(-extension.length) === extension;
            })) {
            // That's a content item's file.
            currentPath = p;
            i++;
            // Build its id from its path.
            id = currentPath.substr(siteRoot.length).replace(sepExp, '/');
            if (id[0] === '/') id = id.substr(1);
            var idParts = id.split('/');
            var last = idParts[idParts.length - 1];
            idParts.pop();
            // Handle index.*
            if (last.substr(0, 6) === 'index.') {
              id = idParts.join('/');
            }
            else {
              // Remove extensions
              var dot = last.indexOf('.');
              if (dot !== -1) {
                last = last.substr(0, dot);
                id = idParts.join('/') + '/' + last;
              }
            }
            if (id === '') id = '/';
            // Check the id against idFilter
            if (idFilter && !idFilter.test(id)) {
              continue;
            }
            found = true;
          }
          else {
            // Try the next entry.
            i++;
          }
        }
        else {
          // Pop back up one level
          p = path.dirname(currentDirPath);
          // If still under the site root
          if (p.substr(0, siteRoot.length) === siteRoot) {
            // Find where we were and carry on from there.
            var currentEntry = path.basename(currentDirPath);
            currentDirPath = p;
            currentDir = fs.readdirSync(p);
            i = currentDir.indexOf(currentEntry) + 1;
          }
          else {
            // We're done.
            currentPath = null;
            found = true;
          }
        }
      }
      if (!currentPath) {
        // Call back one last time.
        callback();
        return;
      }
      // Fetch the item.
      var itemsToFetch = {};
      itemsToFetch[id] = [];
      var loadContext = {
        scope: scope,
        itemsToFetch: itemsToFetch
      };
      scope.callService('content-store', 'loadItems', loadContext, function(err) {
        if (err) {
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

module.exports = fileContentEnumerator;