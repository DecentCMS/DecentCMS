// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');
var fs = require('fs');
var async = require('async');

/**
 * @description
 * A content store that uses JSON files.
 * @param shell
 * @constructor
 */
var FileContentStore = {
  feature: 'file-content-store',
  scope: 'request',
  on: {
    'decent.core.load-items': function (scope, payload) {
      var shapeHelper = scope.require('shape');
      var shell = scope.require('shell');

      var items = payload.items;
      var itemsToFetch = payload.itemsToFetch;
      var callback = payload.callback;

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
              && part.hasOwnProperty('path')) {
              var extraFilePath = path.join(path.dirname(filePath), part.path);
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
            // Call all the item-specific callbacks
            if (Array.isArray(itemsToFetch[id])) {
              for (var j = 0; j < itemsToFetch[id].length; j++) {
                itemsToFetch[id](null, item);
              }
            }
            // Remove from the list of remaining items to fetch
            delete itemsToFetch[id];
            callback();
          });
      };

      async.each(Object.keys(itemsToFetch), function findItemFile(id, next) {
          // TODO: support for redirected roots where a folder points at another. This will enable module documentation sub sites.
          var itemFilePath = path.join(siteDataRoot, id, 'index.json');
          fs.readFile(itemFilePath, function readIndexFile(err, data) {
            if (!err) {
              handle(id, itemFilePath, data.toString(), next);
            }
            else {
              // File not found is normal, so let it flow, but re-throw others
              if (err.code !== 'ENOENT') {
                callback(err);
                return;
              }
              // This was not a folder, maybe it was already a file.
              itemFilePath = path.join(siteDataRoot, id);
              fs.readFile(itemFilePath, function readItemFile(err, data) {
                if (err) {
                  callback(err);
                  return;
                }
                handle(id, itemFilePath, data.toString(), next);
              });
            }
          });
        },
        callback);
    }
  }
};

module.exports = FileContentStore;