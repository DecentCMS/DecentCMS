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
      var item = JSON.parse(data);
      var temp = shapeHelper.temp(item);
      temp.filePath = filePath;
      items[id] = item;
      for(var j = 0; j < itemsToFetch[id].length; j++) {
        itemsToFetch[id](null, item);
      }
      delete itemsToFetch[id];
      if (--count <= 0) {
        callback();
      }
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
              handle(id, itemFilePath, data);
            });
            return;
          }
          handle(id, itemFilePath, data);
        });
      })(id);
    }
  }
};

module.exports = FileContentStore;