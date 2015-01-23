// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');
var fs = require('fs');
var async = require('async');
var YAML = require('yamljs');
var Snippable = require('snippable');
var snippable = new Snippable();

/**
 * @description
 * Parses a multipart YAML/Markdown document.
 * The YAML part becomes the item, and the Markdown
 * becomes the body part with a Markdown flavor.
 * @param {string} data The data to parse.
 * @returns {object} The parsed content item.
 */
function parseYamlMarkdown(data) {
  var parts = snippable.parse(data, ['yaml', 'md']);
  var item = parts[0];
  var md = parts[1];
  item.body = {
    flavor: 'markdown',
    _data: md
  };
  return item;
}

/**
 * @description
 * A content store that uses .json, .yaml, and .yaml.md files.
 */
var fileContentStore = {
  service: 'content-store',
  feature: 'file-content-store',
  scope: 'shell',
  loadItems: function loadItems(context, nextStore) {
    var scope = context.scope;
    var shapeHelper = scope.require('shape');
    var shell = scope.require('shell');

    var items = context.items;
    var itemsToFetch = context.itemsToFetch;

    var handle = function handleItemData(id, filePath, item, callback) {
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
                callback(err);
                return;
              }
              part._data = data.toString();
              next();
            });
          }
          else {
            next();
          }
        },
        function allExtraFilesRead(err) {
          if (err) {
            callback(err);
            return;
          }
          // Add the file path to temp meta data
          var temp = shapeHelper.temp(item);
          temp.filePath = filePath;
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

    var paths = Object.keys(itemsToFetch);
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
              if (err) {nextStore(err); return;}
              var ext = path.extname(p);
              var item = ext === '.json'
                ? JSON.parse(data.toString())
                : ext === '.yaml'
                ? YAML.parse(data.toString())
                : parseYamlMarkdown(data.toString());
              handle(id, p, item, next);
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