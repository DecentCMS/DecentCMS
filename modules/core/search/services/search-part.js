// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: allow the parsed ASTs to be persisted on the part. This will allow the parsing to be done at edit time, thus saving runtime processing.

/**
 * A content part that can query a search index and present the results.
 */
var SearchPart = {
  feature: 'search-part',
  service: 'shape-handler',
  scope: 'request',
  /**
   * Adds a `search-results` shape to `context.shape.temp.shapes`
   * that has the aggregated result for the search on its `result`
   * property.
   *
   * If pagination is used, a second `pagination`shape is also added.
   *
   * The search to perform is specified on `context.temp.item.[part-name]`.
   *
   * The part has the following properties:
   * * {string} indexName The name of the index to use or create.
   * * {string} [idFilter] A filter regular expression to apply to item ids before they are handed to the indexing process.
   * * {string} map A mapping expression for the index. It can refer to the passed-in content item as `item`. It can evaluate as null, an object, or an array of objects.
   * * {string} orderBy An ordering expression for the index. It can refer to the passed-in index entry as `entry`. It can evaluate as an object, or an array.
   * * {string} [where] A where expression. It can refer to the index entry to filter as `entry`. It evaluates as a Boolean.
   * * {string} [reduce] The body of a reduce function. It can refer to the previous value as `val`, the index entry as `entry`, and the index of the entry as `i`. It returns the new value. The part will pass null as the first initial value, so the function should create what it needs if it sees null. If not specified, an array of index entries is the result.
   * * {number} [page] The 0-based page number to display. The default is 0. The page number will be overwritten with the value from the querystring if there is one.
   * * {number} [pageSize] The size of the page. If zero, all results are shown. The default value is 10.
   * * {string} [pageParameter] The name for the pagination parameter that will be added to the querystring on pagination. The default is 'p'. Using different page parameter names enables multiple search results to have independent pagination.
   * * {Boolean} [displayPages] True if page numbers should be displayed in pagination.
   * * {Boolean} [displayNextPrevious] True if pagination should have next and previous buttons.
   * * {Boolean} [displayFirstLast] True if buttons to go to the first and last pages should be displayed by pagination.
   * @param {object} context The context object.
   * @param {object} context.shape The shape to handle.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleSearchPart(context, done) {
    var content = context.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp) {
      done();
      return;
    }
    var temp = content.temp;
    var item = temp.item;
    var scope = context.scope;
    var contentManager = scope.require('content-manager');
    // find the index service, return if there isn't one.
    var indexService = scope.require('index');
    if (!indexService) {
      done();
      return;
    }
    // Find search parts, and return if none is found.
    var searchParts = contentManager.getParts(item, 'search');
    if (searchParts.length === 0) {
      done();
      return;
    }
    // Prepare dependencies.
    var shell = scope.require('shell');
    var request = scope.require('request');
    var searchAstCache = shell['search-ast-cache'] || (shell['search-ast-cache'] = {});
    var evaluate = require('static-eval');
    var parse = require('esprima').parse;
    // Handle each part.
    var async = require('async');
    async.each(searchParts,
      function forEachSearchPart(partName, next) {
        var searchPart = item[partName];
        if (!searchPart) {
          next();
          return;
        }
        // Prepare an AST for the mapping and order by functions.
        var mapSource = '(' + searchPart.map + ')';
        var mapAst = searchAstCache[mapSource] || (searchAstCache[mapSource] = parse(mapSource).body[0].expression);
        var orderBySource = '(' + searchPart.orderBy + ')';
        var orderByAst = searchAstCache[orderBySource] || (searchAstCache[orderBySource] = parse(orderBySource).body[0].expression);
        // Prepare the index.
        var index = indexService.getIndex({
          name: searchPart.indexName,
          idFilter: searchPart.idFilter ? new RegExp(searchPart.idFilter) : null,
          map: function map(item) {
            return evaluate(mapAst, {item: item});
          },
          orderBy: function orderBy(entry) {
            return evaluate(orderByAst, {entry: entry});
          }
        });
        // Prepare the AST for the where function.
        var where = null;
        if (searchPart.where) {
          var whereSource = '(' + searchPart.where + ')';
          var whereAst = searchAstCache[whereSource] || (searchAstCache[whereSource] = parse(whereSource).body[0].expression);
          where = function where(entry) {
            return evaluate(whereAst, {entry: entry});
          };
        }
        // Check if there's a page number on the query string.
        var pageParameter = searchPart.pageParameter || 'p';
        var page = request.query[pageParameter];
        page = (page ? parseInt(page, 10) - 1 : searchPart.page) || 0;
        // Page size is 10 by default, and must be explicitly set to 0 to disable pagination.
        var pageSize = searchPart.hasOwnProperty('pageSize')
          ? searchPart.pageSize
          : 10;
        // Prepare the callback.
        var callback = function indexReduced(reduced) {
          // Change the part into a proper shape
          searchPart.meta = {
            type: 'search-results',
            name: partName,
            alternates: [
              'search-results-' + partName,
              'search-results-' + searchPart.indexName,
              'search-results-' + partName + '-' + searchPart.indexName
            ],
            item: item
          };
          searchPart.temp = {displayType: temp.displayType};
          // Set the reduced result
          searchPart.result = reduced;
          temp.shapes.push(searchPart);
          // If no pagination, because it's been configured that way,
          // or because there's a reduce function, we're done.
          if (pageSize === 0 || searchPart.reduce) {
            next();
            return;
          }
          // Create a pagination shape
          function pushPaginationShape(count) {
            if (pageSize >= count) {
              next();
              return;
            }
            temp.shapes.push({
              meta: {
                type: 'pagination',
                name: partName,
                alternates: [
                  'pagination-' + partName,
                  'pagination-' + searchPart.indexName,
                  'pagination-' + partName + '-' + searchPart.indexName
                ],
                item: item
              },
              temp: {displayType: temp.displayType},
              page: page,
              pageSize: pageSize,
              count: count,
              pageCount: Math.ceil(count / pageSize),
              path: request.path,
              query: request.query,
              pageParameter: pageParameter,
              displayPages: !!searchPart.displayPages,
              displayNextPrevious: !!searchPart.displayNextPrevious,
              displayFirstLast: !!searchPart.displayFirstLast
            });
            next();
          }
          if (where) {
            // We need to count index entries that satisfy the where clause.
            index.reduce({
                reduce: function countEntries(val) {return val + 1;},
                where: where,
                initialValue: 0
              },
              function(countWhere) {pushPaginationShape(countWhere);}
            );
          }
          else {
            // Count the whole index.
            pushPaginationShape(index.getLength());
          }
        };
        // Prepare the AST for the reduce function.
        var reduce = null;
        if (searchPart.reduce) {
          var reduceSource = '(function(val, entry, i){' + searchPart.reduce + '})(val, entry, i)';
          var reduceAst = searchAstCache[reduceSource] || (searchAstCache[reduceSource] = parse(reduceSource).body[0].expression);
          // The reduce function doesn't handle pagination.
          reduce = function reduce(val, entry, i) {
            return evaluate(reduceAst, {val: val, entry: entry, i: i});
          };
          // Finally, do reduce, then create the results shape.
          index.reduce(
            {where: where, reduce: reduce, initialValue: null}, callback);
        }
        else {
          // If no reduce function was provided, just filter the index.
          index.filter({
            where: where, start: pageSize * page, count: pageSize
          }, callback);
        }
      },
      done
    );
  }
};

module.exports = SearchPart;