// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');
var fs = require('fs');
var async = require('async');

/**
 * @description
 * A content store that uses JSON files.
 */
var fileContentStore = {
  service: 'content-store',
  feature: 'file-content-store',
  scope: 'shell',
  loadItems: function (payload, nextStore) {
    var scope = payload.scope;
    var shapeHelper = scope.require('shape');
    var shell = scope.require('shell');

    var items = payload.items;
    var itemsToFetch = payload.itemsToFetch;

    var siteDataRoot = path.join(shell.rootPath, 'data/content');

    var handle = function handleItemData(id, filePath, data, callback) {
      // Parse the content item file
      var item = JSON.parse(data);
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
        // TODO: support for redirected roots where a folder points at another. This will enable module documentation sub sites.
        var itemFilePath = path.join(siteDataRoot, id, 'index.json');
        fs.readFile(itemFilePath, function readIndexFile(err, data) {
          if (!err) {
            handle(id, itemFilePath, data.toString(), next);
          }
          else {
            // File not found is normal, so let it flow, but re-throw others
            if (err.code !== 'ENOENT') {
              nextStore(err);
              return;
            }
            // This was not a folder, maybe it was already a file.
            itemFilePath = path.join(siteDataRoot, id + '.json');
            fs.readFile(itemFilePath, function readItemFile(err, data) {
              if (err) {
                if (err.code === 'ENOENT') {
                  // If the item was not found, we skip the item,
                  // as it may be found by another store.
                  next();
                  return;
                }
                nextStore(err);
                return;
              }
              handle(id, itemFilePath, data.toString(), next);
            });
          }
        });
      },
      nextStore
    );
  }
};

module.exports = fileContentStore;