// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

const lunr = require('lunr');
const {Builder: lunrBuilder, Index: lunrIndex} = lunr;
const path = require('path');
const fs = require('fs');
const async = require('async');

// customize Lunr so it normalizes punctuation
function fixToken(token) {
  const tokenString = token.toString();
  const rewrittenToken = tokenString.replace(/[\(\)\!\?\'\"#&’\.\[\]\{\}…\,”]/g, '');
  return rewrittenToken.length !== tokenString.length ? token.update(() => rewrittenToken) : token;
}

lunr.Pipeline.registerFunction(fixToken, 'normalizeTokens');

function normalizeTokens(builder) {
  builder.pipeline.add(fixToken);
  builder.searchPipeline.add(fixToken);
}

/**
 * An in-memory search engine implementation with file storage suitable for small sites.
 */
class LunrIndex {
  /**
   * Constructs a Lunr index from the provided id filter and map
   * @param {object} scope The scope.
   * @param {RegExp} [idFilter] A regular expression that validates content item ids before they are read and indexed.
   * @param {Function} map The map function takes a content item and returns an index entry, or null.
   * An index entry should have an id property. The index will automatically add an `id` property set to be the id of the item
   * that was used to build the index entries if none is provided.
   * @param {string} name A name for the index.
   * @param {string[]} fields The list of fields to index. If no value is provided, title and body are used.
   * @constructor
   */
  constructor(scope, idFilter, map, name, fields) {
    if (typeof(idFilter) === 'function') {
      orderBy = map;
      map = idFilter;
      idFilter = null;
    }
    this.scope = scope;
    this.idFilter = idFilter;
    this.map = map;
    this.name = name;
    this._index = null;
    this._documents = {};
    this._builder = null;
    this._fields = fields || ['title', 'body'];
  
    // Check if a file exists, and if it does, load it
    const shell = this.scope.require('shell');
    const indexPath = path.resolve(shell.rootPath, 'index');
    if (!fs.existsSync(indexPath)) {
      fs.mkdirSync(indexPath);
    }
    const thisIndexPath = this.indexPath = path.join(indexPath, this.name) + '.lunr.json';
    if (fs.existsSync(thisIndexPath)) {
      const indexContents = JSON.parse(fs.readFileSync(thisIndexPath));
      this._index = lunrIndex.load(indexContents.index);
      this._documents = indexContents.documents;
    }
    else {
      this._builder = new lunrBuilder();
      this._builder.use(normalizeTokens);
      this._fields.forEach(field => this._builder.field(field));
    }
  }

  /**
   * Builds or re-builds the index.
   * Having called that method does not mean that the index
   * will be filled on the next instruction, as this works
   * asynchronously.
   */
  build() {
    const log = this.scope.require('log');
    const context = {
      scope: this.scope,
      idFilter: this.idFilter
    };
    const stores = this.scope.getServices('content-enumerator');
    async.forEach(stores, (store, next) => {
      const iterate = store.getItemEnumerator(context);
      const iterator = (err, item) => {
        if (err) {
          log.error('Item enumeration failed.', {item: item ? item.id : 'unknown', iterating: iterate.name});
          next(err);
          return;
        }
        if (item) {
          if (this.idFilter && !this.idFilter.test(item.id)) {next();return;}
          this.scope.callService('part-loader', 'load', {
            scope: this.scope,
            item: item
          }, () => {
            log.info('Indexing item', {item: item.id});
            const indexEntry = this.map(item);
            if (indexEntry) {
              if (!indexEntry.id) indexEntry.id = item.id;
              this._builder.add(indexEntry);
              this._documents[item.id] = indexEntry;
            }
            iterate(iterator);
          });
        }
        else {
          next();
        }
      };
      iterate(iterator)
    }, () => this._persistIndex());
  }

  /**
   * Searches the index.
   * @param {object} options The options object.
   * @param {string} options.query The query string.
   * @param {Function} [options.where] A condition on the index entries.
   * @param {Number} [options.start] The index of the first entry to be returned
   *   that evaluates true from the where clause.
   * @param {Number} [options.count] The number of entries to return.
   *   Omit if an unlimited number of items can be returned.
   * @param {Function} done The callback, that takes the array of results. The array of results has a `totalCount` property giving the total unpaginated count.
   */
  search(options, done) {
    const index = this._index;
    if (!index) {
      const results = [];
      results.totalCount = 0;
      done(results);
      return;
    }
    let results = index.search(options.query);
    if (options.where) {
      results = results.filter(result => options.where(result));
    }
    const totalCount = results.length;
    if (options.start || options.start === 0) {
      if (options.count) {
        results = results.slice(options.start, options.start + options.count);
      }
      else {
        results = results.slice(options.start);
      }
    }
    results = results.map(result => this._documents[result.ref]);
    results.totalCount = totalCount;
    done(results);
  };

  /**
   * Persists the index to disk.
   * @private
   */
  _persistIndex() {
    this._index = this._builder.build();
    fs.writeFileSync(this.indexPath, JSON.stringify({index: this._index.toJSON(), documents: this._documents}, null, 2));
  };
}

class LunrSearchEngine {
  constructor(scope) {
    this.scope = scope;
    this.indexes = {};
  }

  /**
   * Gets or creates the Lunr index for the provided map function.
   * @param {RegExp} [idFilter] A regular expression that validates content item ids before they are read and indexed.
   * @param {Function} map The map function. It takes a content item and returns null, an index entry, or an array of index entries.
   * @param {boolean} [descending] True to reverse order.
   * @param {string} [name] A unique name for the index. If it's not provided, one will be generated from the source code of the filter, map, and orderBy parameters.
   * @returns {object} The index object.
   */
  getIndex(idFilter, map, name, fields) {
    if (this.indexes[name]) return this.indexes[name];
    const index = this.indexes[name] = new LunrIndex(this.scope, idFilter, map, name, fields);
    if (!index._index) {
      process.nextTick(index.build.bind(index));
    }
    return index;
  };
}
LunrSearchEngine.feature = 'lunr-search';
LunrSearchEngine.service = 'search-engine';
LunrSearchEngine.scope = 'shell';

module.exports = LunrSearchEngine;