// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');
var fs = require('fs');

/**
 * @description
 * A content store that uses JSON files.
 * @param shell
 * @constructor
 */
function FileContentStore(shell) {
  this.shell = shell;
}
FileContentStore.isShellSingleton = true;

FileContentStore.on = {
  'decent.core.load-items': function(shell, payload) {
    var shapeHelper = shell.require('shape');

    var items = payload.items;
    var itemsToFetch = payload.itemsToFetch;
    var callback = payload.callback;

    var count = 0;
    var siteDataRoot = path.join(shell.rootPath, 'data/content');
    var handle = function(id, filePath, data) {
      // Parse the content item file
      var item = JSON.parse(data);
      // Prepare the last operations for later.
      var finalCallback = function() {
        // Add the file path to temp meta data
        var temp = shapeHelper.temp(item);
        temp.filePath = filePath;
        // Add to the items list
        items[id] = item;
        // Call all the item-specific callbacks
        for (var j = 0; j < itemsToFetch[id].length; j++) {
          itemsToFetch[id](null, item);
        }
        // Remove from the list of remaining items to fetch
        delete itemsToFetch[id];
        // If we're done, call the global callback
        if (--count <= 0) {
          callback();
        }
      };
      // Look for any part that needs to load an additional file.
      // Typically, that could be a markdown file for the body.
      var count = 0;
      for (var partName in item) {
        if (partName === 'meta' || partName === 'temp') continue;
        var part = item[partName];
        if (part.hasOwnProperty('path')) {
          count++;
          var extraFilePath = path.join(path.dirname(filePath), part.path);
          fs.readFile(extraFilePath, function(err, data) {
            // TODO: handle error
            part._data = data.toString();
            count--;
            if (count <= 0) finalCallback();
          });
        }
      }
      if (count <= 0) finalCallback();
    };
    for (var id in itemsToFetch) {
      count++;
      (function(id) {
        // TODO: support for redirected roots where a folder points at another. This will enable module documentation sub sites.
        var itemFilePath = path.join(siteDataRoot, id, 'index.json');
        fs.readFile(itemFilePath, function(err, data) {
          if (err) {
            console.log('File not found ' + err.name);
            // TODO: handle only file not found, re-throw the rest.
            // Not a folder, maybe a file
            itemFilePath = path.join(siteDataRoot, id);
            fs.readFile(itemFilePath, function(err, data) {
              if (err) {
                for(var j = 0; j < itemsToFetch[id].length; j++) {
                  itemsToFetch[id](err);
                }
                count--;
                return;
              }
              handle(id, itemFilePath, data.toString());
            });
            return;
          }
          handle(id, itemFilePath, data.toString());
        });
      })(id);
    }
  }
};

module.exports = FileContentStore;