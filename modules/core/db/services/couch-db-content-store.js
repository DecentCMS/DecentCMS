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
    var shell = scope.require('shell');
    var config = shell.settings[CouchContentStore.feature];

    var items = context.items = context.items || {};

    var Couch = scope.require('couch-db');
    var couch = Couch.getCouch(config);
    couch.fetchItems(paths, function (err, newItems) {
      if (err) {
        var log = scope.require('log');
        log.error('CouchDB didn\'t answer correctly.', err);
        nextStore(err);
        return;
      }
      Object.getOwnPropertyNames(newItems)
        .forEach(function copyItem(id) {
          var item = newItems[id];
          items[id] = item;
          // Call all the item-specific callbacks
          if (Array.isArray(itemsToFetch[id])) {
            for (var j = 0; j < itemsToFetch[id].length; j++) {
              itemsToFetch[id][j](null, item);
            }
          }
          delete itemsToFetch[id];
        });
      nextStore();
    });
  }
};

module.exports = CouchContentStore;