// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Couch encapsulates CouchDB data access for DecentCMS.
 * It is not a generic CouchDB library, just a specialized data access
 * library that implements content-centric DecentCMS operations on top
 * of low-level HTTP calls.
 * @param {string} [connection.server] The CouchDB server host name. Default is 'localhost'.
 * @param {number} [connection.port] The port the CouchDB server answers on. Default is 5984.
 * @param {string} [connection.protocol] 'http' or 'https' depending on what protocolshould be used to access the database. The default is 'https'.
 * @param {string} [connection.userVariable] The name of the environment variable that contains the user name to use to access the database.
 * @param {string} [connection.passwordVariable] The name of the environment variable that contains the password to use to access the database.
 * @param {string} config.database The name of the database.
 * @constructor
 */
var Couch = function Couch(connection, config) {
  this.connection = connection;
  this.config = config;
};

/**
 * Sends a simple get request to the database.
 * @param {string} query The part of the query URL that goes after '`/database/`'.
 * @param {Function} callback The callback function that will be called with an error and a parsed JavaScript object.
 */
Couch.prototype.get = function get(query, callback) {
  this.send({
    query: query,
    verb: 'GET'
  }, callback);
};

/**
 * Sends a simple post request to the database.
 * @param {string} query The part of the query URL that goes after '`/database/`'.
 * @param {object} post The object to serialize and use as the post's body.
 * @param {Function} callback The callback function that will be called with an error and a parsed JavaScript object.
 */
Couch.prototype.post = function post(query, post, callback) {
  this.send({
    query: query,
    post: post,
    verb: 'POST'
  }, callback);
};

/**
 * Sends a simple request to the database.
 * @param {object} options The options object.
 * @param {string} [options.verb] The verb to use. The default is "GET" if there is no post data, and "POST" otherwise.
 * @param {string} options.query The part of the query URL that goes after '`/database/`'.
 * @param {object} [options.post] The object to serialize and use as the post's body.
 * @param {Function} callback The callback function that will be called with an error and a parsed JavaScript object.
 */
Couch.prototype.send = function send(options, callback) {
  var connection = this.connection;
  var config = this.config;
  var query = options.query;
  var post = options.post;
  var verb = options.verb || (post ? 'POST' : 'GET');
  var postData = post ? JSON.stringify(post) : null;
  var httpOptions = {
    hostname: connection.server,
    port: connection.port,
    method: verb,
    auth: process.env[connection.userVariable]
    + ':' + process.env[connection.passwordVariable],
    path: '/' + config.database + '/' + query
  };
  if (postData) {
    httpOptions.headers = {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    };
  }
  var request = require(connection.protocol === 'http' ? 'http' : 'https')
    .request(httpOptions, function handleCouchResponse(response) {
      response.setEncoding('utf8');
      var chunks = [];
      response.on('data', function addChunk(chunk) {
        chunks.push(chunk);
      });
      response.on('end', function processCouchData() {
        var data = JSON.parse(chunks.join(''));
        callback(null, data);
      });
    });
  request.on('error', function handleError(err) {
    callback(err);
  });
  if (postData) request.write(postData);
  request.end();
};

/**
 * Transforms a CouchDB row into a content item.
 * @param {object} row The row.
 * @returns {object} The item extracted from the row.
 */
Couch.prototype.toItem = function toItem(row) {
  var item = row.doc;
  // Set the id property on the item.
  item.id = row.id;
  delete item._id;
  // Add some pedigree information to temp.
  item.temp = {
    storage: 'CouchDB',
    database: this.config.database
  };
  return item;
};

/**
 * Fetches the items for which ids have been specified, and returns
 * them as properties of an object, the property name being the id of
 * the item.
 * @param {Array} keys The list of item ids to fetch.
 * @param {Function} callback The callback that receives an error and an object with properties that have the fetched item ids as their names, and the items as their values.
 */
Couch.prototype.fetchItems = function(keys, callback) {
  var self = this;
  self.post('_all_docs?include_docs=true', {keys: keys},
    function returnRowsAsItems(err, data) {
      if (data.error) {
        callback(data);
        return;
      }
      var rows = data.rows;
      var items = {};
      rows.forEach(function forEachRow(row) {
        // Ignore rows not found or deleted.
        if (row.error || (row.value && row.value.deleted)) return;
        // Extract the content item from the row and put it on the results object.
        items[row.id] = self.toItem(row);
      });
      callback(null, items);
    });
};

/**
 * Fetches a page of items in the database, filtered by id.
 * This method creates an index in the database for each different filter used.
 * @param {object} options The options.
 * @param {number} options.page The 0-based index of the page to fetch.
 * @param {RegExp} options.idFilter The regular expression that the content item ids must satisfy to be in the index.
 * @param {number} options.pageSize The number of items per page. The default is 10.
 * @param {Function} callback The function to call back with an error and an array containing the items for the page.
 */
Couch.prototype.getIndexPage = function getIndexPage(options, callback) {
  var self = this;
  self.getFilteredIndexView(options.idFilter, function(err, viewName) {
    if (err) {
      callback(err);
      return;
    }
    var page = options.page;
    var pageSize = options.pageSize || 10;
    var query =  '_design/filtered_index/_view/' + viewName
      + '?include_docs=true&skip=' + (page * pageSize)
      + '&limit=' + pageSize;
    self.get(query, function mapRowsToItems(err, data) {
      if (err) {
        callback(err);
        return;
      }
      var items = data.rows.map(function(row) {return self.toItem(row);});
      callback(null, items);
    });
  });
};

var sanitizeViewName = function (idFilter) {
  if (!idFilter) return 'all';

  return (idFilter.source + 'filter')
    .replace(/[\[\]\(\)\{}\/\.\\\^\$\*\+\?=!\|:;\s]/g,
    function replaceSpecialCharacters(char) {
      switch (char) {
        case '[':
          return 'opensquare_';
        case ']':
          return 'closesquare_';
        case '(':
          return 'openparen_';
        case ')':
          return 'closeparen_';
        case '{':
          return 'opencurly_';
        case '}':
          return 'closecurly_';
        case '/':
          return 'slash_';
        case '.':
          return 'dot_';
        case '\\':
          return 'back_';
        case '^':
          return 'start_';
        case '$':
          return 'end_';
        case '*':
          return 'star_';
        case '+':
          return 'plus_';
        case '?':
          return 'question_';
        case '=':
          return 'equal_';
        case '!':
          return 'bang_';
        case '|':
          return 'pipe_';
        case ':':
          return 'colon_';
        case ';':
          return 'semi_';
        default:
          return 'under_';
      }
    });
};

/**
 * Gets the name of a filtered view for the specified filter.
 * @param {RegExp} idFilter A regular expression that ids should be filtered on.
 * @param {Function} callback A callback function that will get called with an error and the name of the view corresponding to the filter.
 */
Couch.prototype.getFilteredIndexView = function getFilteredIndexView(idFilter, callback) {
  var self = this;
  // Look for the design document where we store those indexed views.
  self.get('_design/filtered_index', function findOrCreateIndex(err, indexData) {
    if (err) {
      callback(err);
      return;
    }
    var rev = null;
    var viewName = sanitizeViewName(idFilter);
    if (indexData.error === 'not_found') {
      // Create the design document.
      indexData = {
        language: 'javascript',
        views: {}
      };
    }
    else {
      rev = indexData._rev;
      if (!indexData.views) indexData.views = {};
    }
    if (!indexData.views.hasOwnProperty(viewName)) {
      var payload = {
        query: '_design/filtered_index',
        post: indexData,
        verb: 'PUT'
      };
      if (rev) payload._rev = rev;
      indexData.views[viewName] = {
        map: 'function(doc) {if (/'
        + idFilter.source + '/'
        + '.test(doc._id)) {emit(doc._id, doc);}}'
      };
      self.send(payload, function onDesignDocumentDone(err, designDocData) {
        if (err) {
          callback(err);
          return;
        }
        if (!designDocData.ok) {
          callback(designDocData);
          return;
        }
        callback(null, viewName);
      });
    }
    else {
      callback(null, viewName);
    }
  });
};

module.exports = Couch;
