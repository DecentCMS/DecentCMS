// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: deal with pagination issues in case of modifications while indexing is going on

/**
 * @description
 * A content enumerator that looks for content stored in a CouchDB database.
 */
var CouchContentEnumerator = {
  service: 'content-enumerator',
  feature: 'couch-db-content-store',
  scope: 'shell',
  /**
   * Gets an asynchronous enumerator for all the items in the store.
   * @param {object} context The context.
   * @param {object} context.scope The scope.
   * @param {RegExp|string} [context.idFilter] A regular expression that validates content item ids before they are read and indexed.
   * @returns {Function} The function that gets the next item. It takes a callback function as its parameter
   */
  getItemEnumerator: function(context) {
    var scope = context.scope;
    var idFilter = typeof(context.idFilter) === 'string'
      ? new RegExp(context.idFilter)
      : context.idFilter || /^[^_]/;
    var shell = scope.require('shell');
    var config = shell.settings[CouchContentEnumerator.feature];
    var Couch = scope.require('couch-db');
    var couch = Couch.getCouch(config);

    var pageSize = config.indexingPageSize;
    var currentPage = 0;
    var pageItems = null;

    var rowIndex = 0;
    /**
     * Looks for the next item in the store.
     * @param {Function} callback the function that gets called
     *   when the item has been fetched.
     *   This function takes an error object and the item as its
     *   parameters. When all items have been enumerated, the
     *   callback is called without parameters.
     */
    var getNextItem = function getNextItem(callback) {
      if (pageItems == null || rowIndex + 1 > pageItems.length) {
        // We need a new page
        couch.getIndexPage({
          page: currentPage++,
          idFilter: idFilter,
          pageSize: pageSize},
          function handleNewItems(err, items) {
            if (err) {
              scope.require('log').error('CouchDB error', err);
              callback(err);
              return;
            }
            if (items.length === 0) {
              callback();
              return;
            }
            pageItems = items;
            rowIndex = 1;
            callback(null, items[0]);
          });
        return;
      }
      callback(null, pageItems[rowIndex++]);
    };
    return getNextItem;
  }
};

module.exports = CouchContentEnumerator;