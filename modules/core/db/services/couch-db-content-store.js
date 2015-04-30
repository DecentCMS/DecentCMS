// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A content store that uses a CouchDB database for storage.
 */
var CouchContentStore = {
  service: 'content-store',
  feature: 'couch-db-content-store',
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

    var scope = context.scope;
    var shapeHelper = scope.require('shape');
    var log = scope.require('log');
    var shell = scope.require('shell');
    var config = shell.settings[CouchContentStore.feature];

    var items = context.items = context.items || {};

    var postData = JSON.stringify({keys: paths});
    var request = require(config.protocol === 'http' ? 'http' : 'https')
      .request({
        hostname: config.server,
        port: config.port,
        method: 'POST',
        auth: process.env[config.userVariable] + ':' + process.env[config.passwordVariable],
        path: '/' + config.database + '/_all_docs?include_docs=true',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
    }, function handleCouchResponse(response) {
        response.setEncoding('utf8');
        var chunks = [];
        response.on('data', function addChunk(chunk) {
          chunks.push(chunk);
        });
        response.on('end', function processCouchData() {
          var data = JSON.parse(chunks.join(''));
          if (data.error) {
            var err = {error: data.error, reason: data.reason};
            log.error('CouchDB error.', err);
            nextStore(err);
            return;
          }
          var rows = data.rows;
          rows.forEach(function forEachRow(row) {
            if (row.error || (row.value && row.value.deleted)) return;
            var item = row.doc;
            var id = row.id;
            // Add the provider and database name to temp meta data
            var temp = shapeHelper.temp(item);
            temp.storage = 'CouchDB';
            temp.database = config.database;
            // Add to the items list
            items[id] = item;
            // Set the id property on the item
            item.id = id;
            delete item._id;
            // Call all the item-specific callbacks
            if (Array.isArray(itemsToFetch[id])) {
              for (var j = 0; j < itemsToFetch[id].length; j++) {
                itemsToFetch[id][j](null, item);
              }
            }
            // Remove from the list of remaining items to fetch
            delete itemsToFetch[id];
          });
          nextStore();
        });
      });
    request.on('error', function handleError(err) {
      log.error('CouchDB didn\'t answer correctly.', err);
      nextStore(err);
    });
    request.write(postData);
    request.end();
  }
};

module.exports = CouchContentStore;