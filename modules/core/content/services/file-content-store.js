// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A content store that uses .json, .yaml, and .yaml.md files.
 */
var fileContentStore = {
  service: 'content-store',
  feature: 'file-content-store',
  scope: 'shell',
  /**
   * Loads the items from context.itemsToFetch that can be found in the store
   * and puts the results on context.items.
   * @param {object} context The context object.
   * @param {object} context.scope The scope.
   * @param {object} [context.request] The request.
   * @param {object} context.itemsToFetch The ids of the items to fetch are the property names on this object, and the values are arrays of callback functions to be called once the item has been loaded. Those callback functions should take an error and the item as their parameters.
   * @param {object} context.items The fetched items. Property names are ids, and values are the items themselves.
   * @param {Function} nextStore The callback that will call into the next store. It should take an error as its parameter.
   */
  loadItems: function loadItems(context, nextStore) {
    var itemsToFetch = context.itemsToFetch;
    var paths = Object.getOwnPropertyNames(itemsToFetch);
    if (paths.length === 0) {
      nextStore();
      return;
    }

    var path = require('path');
    var fs = require('fs');
    var async = require('async');

    var scope = context.scope;
    var shapeHelper = scope.require('shape');
    var shell = scope.require('shell');
    var log = scope.require('log');

    var items = context.items = context.items || {};

    var handle = function handleItemData(id, filePath, item, callback) {
      if (!item) {
        var error = new Error("File content store can't process an undefined item.", filePath);
        log.error(error);
        callback(error);
        return;
      }
      // Default content type is page:
      var meta = item.meta = item.meta || {};
      meta.type = meta.type || 'page';
      // Parse the content item file
      // Look for any part that needs to load an additional file.
      // Typically, that could be a markdown file for the body.
      async.each(Object.keys(item), function lookForExtraFile(partName, next) {
          var part;
          if (partName !== 'meta'
            && partName !== 'temp'
            && (part = item[partName])
            && part.hasOwnProperty('src')) {
            var extraFilePath = path.join(path.dirname(filePath), part.src);
            fs.readFile(extraFilePath, function extraFileRead(err, data) {
              if (err) {
                log.error("Couldn't read extra file from file content store.", err);
                callback(err);
                return;
              }
              part.text = data.toString();
              next();
            });
          }
          else {
            next();
          }
        },
        function allExtraFilesRead(err) {
          if (err) {
            log.error("Error while reading extra files.", err);
            callback(err);
            return;
          }
          // Add the file path and name to temp meta data
          var temp = shapeHelper.temp(item);
          temp.storage = 'FileSystem';
          temp.filePath = filePath;
          var baseName = path.basename(filePath);
          var extensionIndex = baseName.indexOf('.');
          temp.name = extensionIndex >= 0 ? baseName.substr(0, extensionIndex) : baseName;
          // Add to the items list
          items[id] = item;
          // Set the id property on the item
          item.id = id;
          // Call all the item-specific callbacks
          if (Array.isArray(itemsToFetch[id])) {
            for (var j = 0; j < itemsToFetch[id].length; j++) {
              itemsToFetch[id][j](null, item);
            }
          }
          // Remove from the list of remaining items to fetch
          delete itemsToFetch[id];
          callback();
        });
    };

    async.each(
      paths,
      function(id, next) {
        var rootSeparatorIndex = id.indexOf(':');
        var root = 'content';
        var localId = id;
        if (rootSeparatorIndex !== -1) {
          root = id.substr(0, rootSeparatorIndex);
          localId = id.substr(rootSeparatorIndex + 1);
        }
        var mappingServices = scope.getServices('id-to-path-map');
        var paths = [];
        mappingServices.forEach(function forEachIdToPathMap(mappingService) {
          var servicePaths = mappingService.mapIdToPath(root, localId);
          if (servicePaths && servicePaths.length > 0) {
            Array.prototype.push.apply(paths, servicePaths);
          }
        });
        var found = false;
        paths.forEach(function forEachPath(p) {
          if (found) return;
          if (fs.existsSync(p)) {
            found = true;
            fs.readFile(p, function readItemFile(err, data) {
              if (err) {
                log.error("Couldn't read item file from file content store.", err);
                nextStore(err);
                return;
              }
              var parserContext = {
                scope: scope,
                path: p,
                data: data.toString()
              };
              scope.callService(
                'content-file-parser', 'parse',
                parserContext,
                function fileParsed(err) {
                  if (err) {
                    log.error("File couldn't be parsed by the file content parser.", err);
                    next(err);
                  }
                  var item = parserContext.item;
                  handle(id, p, item, next);
                });
            });
          }
        });
        if (!found) next();
      },
      nextStore
    );
  }
};

module.exports = fileContentStore;