// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');
var fs = require('fs');
var async = require('async');

/**
 * An in-memory index implementation with file storage suitable for small sites.
 * @param {object} scope The scope.
 * @param {RegExp|string} [idFilter] A regular expression that validates
 *   content item ids before they are read and indexed.
 * @param {Function} map The map function takes a content item and returns
 *   an array of index entries, a single index entry, or null.
 *   An index entry should have an id property.
 *   The index will automatically add an `itemId` property set to be the id of
 *   the item that was used to build the index entries.
 * @param {Function} [orderBy] The function that defines the order
 *   on which the index entry should be sorted.
 *   The sort order can be a simple string, date, number, or it can be an array,
 *   in which case the items in the array will be used one after the other.
 *   It takes an index entry, and returns the sort order.
 * @param {string} [name] A name for the index. If not provided, one will be built from the other parameters.
 * @constructor
 */
function FileIndex(scope, idFilter, map, orderBy, name) {
  if (typeof(idFilter) === 'function') {
    orderBy = map;
    map = idFilter;
    idFilter = null;
  }
  this.scope = scope;
  this.idFilter = idFilter;
  this.map = map;
  this.orderBy = orderBy;
  this.name = name || FileIndex._toName(map, orderBy);
  this._unsortedIndex = null;
  this._index = null;

  // Check if a file exists, and if it does, load it
  var shell = this.scope.require('shell');
  var indexPath = path.resolve(shell.rootPath, 'index');
  if (!fs.existsSync(indexPath)) {
    fs.mkdirSync(indexPath);
  }
  var thatIndexPath = this.indexPath = path.join(indexPath, this.name) + '.json';
  if (fs.existsSync(thatIndexPath)) {
    this._index = require(thatIndexPath);
  }
}

/**
 * Generates a valid identifier from one or several objects,
 * using their string form.
 * @param {Function[]} [arguments] The function for which a name is needed.
 * @returns {string} A valid name built from the objects passed in.
 */
FileIndex._toName = FileIndex.prototype._toName = function toName() {
  var args = Array.prototype.slice.apply(arguments);
  var names = args
    .filter(function(arg) {return arg && arg.name;})
    .map(function(arg) {return arg.name;})
    .join('-');
  var hash = args
    .map(function(arg) {return arg ? arg.toString() : '';})
    .join('').split('')
    .reduce(function(a, b){
      a=((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
  return 'index-' + names + '-' + hash;
};

/**
 * Filters the index with a where clause.
 * @param {object} options The options object.
 * @param {Function} options.where The where function. It takes an index entry,
 *   and returns true if the entry should be included.
 * @param {Number} [options.start] The index of the first entry to be returned
 *   that evaluates true from the where clause.
 * @param {Number} [options.count] The number of entries to return.
 *   Omit if an unlimited number of items can be returned.
 * @param {Function} done The callback, that takes the array of index
 * entries satisfying the where clause and within the range as its
 * parameter.
 */
FileIndex.prototype.filter = function filter(options, done) {
  var start = options.start || 0;
  var index = this._index || [];
  if (!options.where) {
    done(index.slice(start, start + options.count));
    return;
  }
  var results = [];
  for (var i = 0, j = 0; i < index.length && (!options.count || j < start + options.count); i++) {
    var entry = index[i];
    if (options.where(entry)) {
      if (j >= start) {
        results.push(entry);
      }
      j++;
    }
  }
  done(results);
};

/**
 * Reduces the index to an aggregated object.
 * @param {object} options The options object.
 * @param {Function} [options.where] A condition on the index entries.
 * @param {Function} options.reduce The reduce function. It takes the previous value, the entry to process, and the index of the entry. It returns the new value.
 * @param {*} options.initialValue The initial value or seed of the aggregation.
 * @param {Function} done The callback, that takes the aggregated value
 * of index entries satisfying the where clause.
 */
FileIndex.prototype.reduce = function reduce(options, done) {
  var index = this._index || [];
  var val = options.initialValue;
  if (!options.where) {
    done(index.reduce(options.reduce, val));
    return;
  }
  for (var i = 0; i < index.length; i++) {
    var entry = index[i];
    if (!options.where || options.where(entry)) {
      val = options.reduce(val, entry, i);
    }
  }
  done(val);
};

FileIndex.prototype._compare = function compare(a, b) {
  a = a._order || (a._order = this.orderBy(a));
  b = b._order || (b._order = this.orderBy(b));
  a = Array.isArray(a) ? a : [a];
  b = Array.isArray(b) ? b : [b];
  for (var i = 0; i < a.length && i < b.length; i++) {
    var ai = a[i];
    var bi = b[i];
    if ((!ai && bi) || ai < bi) return -1;
    if ((!bi && ai) || bi < ai) return 1;
  }
  return a.length - b.length;
};

/**
 * Adds index entries to the provided internal index.
 * @param {Array} index The internal index array to which the entries
 *   will be added.
 * @param {Array|object|null} indexEntries The result of a map call.
 * @param {string} id The id of the item that was mapped.
 * @param {Boolean} [sorted] Is the index sorted already?
 */
FileIndex.prototype._addToIndex = function addToIndex(index, indexEntries, id, sorted) {
  // TODO; can we apply a faster algorithm to find where to insert the entries?
  var self = this;
  if (indexEntries) {
    if (!Array.isArray(indexEntries)) {
      indexEntries = [indexEntries];
    }
    indexEntries.forEach(function addItemIdToEachEntry(entry) {
      entry.itemId = id;
    });
    if (sorted && self.orderBy) {
      // Insert the new entries
      indexEntries.forEach(function(newEntry) {
        for (var i = 0, existingEntry = index[0];
             i < index.length; i++, existingEntry = index[i]) {
          if (self._compare(existingEntry, newEntry) > 0) {
            index.splice(i, 0, newEntry);
            break;
          }
        }
      });
    }
    else {
      Array.prototype.push.apply(index, indexEntries);
    }
  }
};

/**
 * Builds or re-builds the index.
 * Having called that method does not mean that the index
 * will be filled on the next instruction, as this works
 * asynchronously.
 */
FileIndex.prototype.build = function build() {
  var self = this;
  var log = self.scope.require('log');
  var unsortedIndex = self._unsortedIndex = [];
  var context = {
    scope: self.scope,
    idFilter: self.idFilter
  };
  var stores = self.scope.getServices('content-enumerator');
  async.forEach(stores, function forEachStore(store, next) {
    var iterate = store.getItemEnumerator(context);
    var iterator = function forEachItem(err, item) {
      if (err) {
        log.error('Item enumeration failed.', {item: item ? item.id : 'unknown', iterating: iterate.name});
        next(err);
        return;
      }
      if (item) {
        log.info('Indexing item', {item: item.id});
        var indexEntries = self.map(item);
        self._addToIndex(unsortedIndex, indexEntries, item.id);
        iterate(iterator);
      }
      else {
        next();
      }
    };
    iterate(iterator)
  }, function() {
    // We have all the items. Now sort.
    self._index = self.orderBy ? unsortedIndex.sort(self._compare.bind(self)) : unsortedIndex;
    // Reset unsorted index.
    self._unsortedIndex = null;
    // And finally, persist.
    self._persistIndex();
  });
};

/**
 * Persists the index to disk.
 * @private
 */
FileIndex.prototype._persistIndex = function() {
  fs.writeFileSync(this.indexPath, JSON.stringify(this._index, null, 2));
};

/**
 * Removes existing entries for a specific item id from an internal index.
 * @param {Array} index The internal index.
 * @param {Number} itemId The item id to remove.
 * @returns {boolean} Whether the itemId was present in the index.
 */
FileIndex.prototype._removeExistingEntries = function removeExistingEntries(index, itemId) {
  var wasIndexed = false;
  // Search and remove the already existing index entries
  for (var i = 0; i < index.length;) {
    var entry = index[i];
    if (entry.itemId === itemId) {
      index.splice(i, 1);
      wasIndexed = true;
    }
    else {
      i++;
    }
  }
  return wasIndexed;
};

/**
 * Updates the index with the results of mapping the provided item.
 * @param {object} item The item to index.
 */
FileIndex.prototype.updateWith = function updateWith(item) {
  // Don't do anything if the id doesn't satisfy the id filter.
  if (this.idFilter && !this.idFilter.test(item.id)) return;
  // Get index entries for this item.
  var indexEntries = this.map(item);
  if (this._unsortedIndex) {
    // uh oh, indexing is in progress. Let's see if that particular item
    // was already indexed.
    var wasIndexed = this._removeExistingEntries(this._unsortedIndex, item.id);
    // If it wasn't already indexed, let it be, it will eventually.
    // Otherwise, let's add it back.
    if (wasIndexed) {
      this._addToIndex(this._unsortedIndex, indexEntries, item.id);
    }
  }
  if (this._index) {
    // Do the same with the index currently in use.
    this._removeExistingEntries(this._index, item.id);
    this._addToIndex(this._index, indexEntries, item.id, true);
    this._persistIndex();
  }
};

/**
 * Remove entries corresponding to the provided item from the index.
 * @param {object} item The content item to remove.
 */
FileIndex.prototype.remove = function remove(item) {
  if (this._unsortedIndex) this._removeExistingEntries(this._unsortedIndex, item.id);
  if (this._index) {
    this._removeExistingEntries(this._index, item.id);
    this._persistIndex();
  }
};

/**
 * Gets the current progress of the indexing process.
 * @returns {Number} The number of entries that have already been
 *   added to the index. Once the indexing process is finished, the
 *   number of index entries is returned.
 */
FileIndex.prototype.getProgress = function getProgress() {
  var unsortedIndex = this._unsortedIndex;
  if (unsortedIndex) return unsortedIndex.length;
  if (this._index) return this._index.length;
  return 0;
};

/**
 * Gets the number of entries available in the index at the time
 * the function is called. To know how many entries have been
 * added to the index, but that are not necessarily available
 * for querying yet, use getProgress.
 * @returns {Number} The number of entries in the index.
 */
FileIndex.prototype.getLength = function getLength() {
  return this._index ? this._index.length : 0;
};

/**
 * Creates and caches index objects.
 * @param {object} scope The scope.
 * @constructor
 */
function FileIndexFactory(scope) {
  this.scope = scope;
  this.indexes = {};
}
FileIndexFactory.feature = 'file-index';
FileIndexFactory.service = 'index-store';
FileIndexFactory.scope = 'shell';

/**
 * Gets or creates the index for the provided map and order by functions.
 * @param {RegExp|string} [idFilter] A regular expression that validates
 *   content item ids before they are read and indexed.
 * @param {Function} map The map function. It takes a content item and
 *   returns null, an index entry, or an array of index entries.
 * @param {Function} [orderBy] The function that defines the order
 *   on which the index entries should be sorted.
 *   It takes an index entry, and returns the sort order.
 *   The sort order can be a simple string, date, number, or it can be an array,
 *   in which case the items in the array will be used one after the other.
 *   It is recommended to name the order function.
 * @returns {object} The index object.
 * @param {string} [name] A unique name for the index. If it's not provided, one will be generated from the source code of the filter, map, and orderBy parameters.
 */
FileIndexFactory.prototype.getIndex = function getIndex(idFilter, map, orderBy, name) {
  name = name || FileIndex._toName(idFilter, map, orderBy);
  if (this.indexes[name]) return this.indexes[name];
  var index = this.indexes[name] = new FileIndex(this.scope, idFilter, map, orderBy, name);
  if (!index._index && !index._unsortedIndex) {
    process.nextTick(index.build.bind(index));
  }
  return index;
};

FileIndexFactory._toName = FileIndex._toName;

module.exports = FileIndexFactory;