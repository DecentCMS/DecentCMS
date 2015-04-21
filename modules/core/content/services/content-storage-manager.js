// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * The ContentStorageManager is responsible for the content retrieval.
 */
function ContentStorageManager(scope) {
  this.scope = scope;
  scope.items = scope.items || {};
  scope.itemsToFetch = scope.itemsToFetch || {};
}
ContentStorageManager.feature = 'content';
ContentStorageManager.service = 'storage-manager';
ContentStorageManager.scope = 'request';
ContentStorageManager.isScopeSingleton = true;

/**
 * @description
 * Promises to get one or several content items.
 * @param {string|Array} id the id or ids of the items to fetch.
 * @param {Function} [callback] A function with signature (err, item) that will get called once per item once the item has been loaded.
 */
ContentStorageManager.prototype.promiseToGet = function promiseToGet(id, callback) {
  var self = this;
  var itemsToFetch = self.scope.itemsToFetch;
  // id can be an array of ids
  id = Array.isArray(id) ? id : [id];
  id.forEach(function forEachId(itemId) {
    if (itemsToFetch.hasOwnProperty(itemId)) {
      if (callback) {
        itemsToFetch[itemId].push(callback);
      }
    }
    else {
      itemsToFetch[itemId] = callback ? [callback] : [];
    }
  });
};

/**
 * @description
 * Gets an item from the collection of items that the content
 * manager has already fetched. If not found, null, is returned.
 * @param {string} id The id of the item to fetch.
 * @returns {object} The content item, or null if not found.
 */
ContentStorageManager.prototype.getAvailableItem = function getAvailableItem(id) {
  var item = this.scope.items[id];
  if (item) return item;
  return null;
};

/**
 * @description
 * Triggers the asynchronous fetching of the items whose
 * ids can be found in the content manager's itemsToFetch
 * array, and their transfer into the items array.
 * This method emits the decent.core.load-items event.
 * @param {object} context the context.
 * @param {object} [context.request] the current request
 * @param {Function} [callback] a callback that gets called when all items have been fetched, or when an error occurs.
 */
ContentStorageManager.prototype.fetchContent = function fetchContent(context, callback) {
  var scope = this.scope;
  var itemsToFetch = scope.itemsToFetch;
  Object.getOwnPropertyNames(itemsToFetch)
    .forEach(function(id) {
      if (scope.items.hasOwnProperty(id)
        && itemsToFetch
        && itemsToFetch.hasOwnProperty(id)) {
        // items was already fetched, just call the callback
        // and remove the item from the list to fetch.
        for (var i = 0; i < itemsToFetch[id].length; i++) {
          var itemCallback = itemsToFetch[id][i];
          if (itemCallback) itemCallback(null, scope.items[id]);
        }
        delete itemsToFetch[id];
      }
    });
  if (Object.getOwnPropertyNames(itemsToFetch).length > 0) {
    scope.callService('content-store', 'loadItems', {
      scope: scope,
      request: context.request,
      items: scope.items,
      itemsToFetch: itemsToFetch
    }, callback);
  }
  else if (callback) {
    callback();
  }
};

module.exports = ContentStorageManager;