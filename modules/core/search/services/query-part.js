// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: allow the parsed ASTs to be persisted on the part. This will allow the parsing to be done at edit time, thus saving runtime processing.

/**
 * A content part that can query a query index and present the results.
 */
const QueryPart = {
  feature: 'query-part',
  service: 'query-part-handler',
  scope: 'request',
  /**
   * Adds a `search-results` shape to `context.shapes`
   * that has the aggregated result for the search on its `result`
   * property.
   *
   * If pagination is used, a second `pagination`shape is also added.
   *
   * The search to perform is specified on `context.part`.
   *
   * The part has the following properties:
   *
   *  Property              | Type      | Description
   * -----------------------|-----------|-------------------------------------------------------------------------------------------------
   *  [indexName]           | `string`  | The name of the index to use or create.
   *  [definition]          | `string`  | The name of an index definition to get from index definition providers and to replace direct specification of id filter, map, order by, and descending, where, reduce, and name.
   *  [idFilter]            | `string`  | A filter regular expression to apply to item ids before they are handed to the indexing process.
   *  map                   | `string`  | A mapping expression for the index. It can refer to the passed-in content item as `item`. It can evaluate as null, an object, or an array of objects.
   *  orderBy               | `string`  | An ordering expression for the index. It can refer to the passed-in index entry as `entry`. It can evaluate as an object, or an array.
   *  [where]               | `string`  | A where expression. It can refer to the index entry to filter as `entry` and to the parsed query string as `query`. It evaluates as a Boolean.
   *  [reduce]              | `string`  | A reduce expression. It can refer to the previous value as `val`, the index entry as `entry`, and the index of the entry as `i`. It evaluates as the new value. The part will pass null as the first initial value, so the function should create what it needs if it sees null. If not specified, an array of index entries is the result.
   *  [page]                | `number`  | The 0-based page number to display. The default is 0. The page number will be overwritten with the value from the querystring if there is one.
   *  [pageSize]            | `number`  | The size of the page. If zero, all results are shown. The default value is 10.
   *  [pageParameter]       | `string`  | The name for the pagination parameter that will be added to the querystring on pagination. The default is 'p'. Using different page parameter names enables multiple search results to have independent pagination.
   *  [displayPages]        | `Boolean` | True if page numbers should be displayed in pagination.
   *  [displayNextPrevious] | `Boolean` | True if pagination should have next and previous buttons.
   *  [displayFirstLast]    | `Boolean` | True if buttons to go to the first and last pages should be displayed by pagination.
   *
   * @param {object} context The context object.
   * @param {object} context.part The query part to handle.
   * @param {string} context.partName The name of the part.
   * @param {string} context.displayType The display type.
   * @param {object} context.item A reference to the content item.
   * @param {Array} context.shapes The shapes array to which new shapes must be pushed.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleQueryPart(context, done) {
    const shapes = context.shapes;
    if (!shapes) {done();return;}
    const scope = context.scope;

    // find the index service, return if there isn't one.
    const indexService = scope.require('index');
    if (!indexService) {done();return;}

    // Prepare dependencies.
    const request = scope.require('request');
    const queryPart = context.part;
    
    // Is there an index definition name?
    let indexName, idFilter, map, orderBy, descending, where, reduce;
    const definitionName = queryPart.definition;
    if (definitionName) {
      const indexDefinitionProvider = scope.require('index-definition-provider');
      if (indexDefinitionProvider) {
        const definition = indexDefinitionProvider.getDefinition(definitionName);
        if (definition) {
          if (definition.idFilter) idFilter = definition.idFilter;
          if (definition.name) indexName = definition.name;
          if (definition.map) map = definition.map;
          if (definition.orderBy) orderBy = definition.orderBy;
          if (typeof(definition.descending) === 'boolean') descending = definition.descending;
          if (definition.where) where = entry => definition.where(entry, context.scope.query);
          if (definition.reduce) reduce = definition.reduce;
        }
      }
    }

    if (!map || !orderBy || (!where && queryPart.where) || (!reduce && queryPart.reduce)) {
      const shell = scope.require('shell');
      const astCache = shell['ast-cache'] || (shell['ast-cache'] = {});
      const evaluate = require('static-eval');
      const parse = require('esprima').parse;
      // Prepare an AST for the mapping, where, and order by functions.
      if (!map) {
        const mapSource = '(' + (queryPart.map || '{}') + ')';
        const mapAst = astCache[mapSource] || (astCache[mapSource] = parse(mapSource).body[0].expression);
        map = item => evaluate(mapAst, {item});
      }
      if (!orderBy) {
        const orderBySource = '(' + queryPart.orderBy + ')';
        const orderByAst = astCache[orderBySource] || (astCache[orderBySource] = parse(orderBySource).body[0].expression);
        orderBy = entry => evaluate(orderByAst, {entry});
      }
      if (!where && queryPart.where) {
        const whereSource = '(' + queryPart.where + ')';
        const whereAst = astCache[whereSource] || (astCache[whereSource] = parse(whereSource).body[0].expression);
        where = entry => evaluate(whereAst, {entry, query: context.scope.query});
      }
      if (!reduce && queryPart.reduce) {
        const reduceSource = queryPart.reduce;
        const reduceAst = astCache[reduceSource] || (astCache[reduceSource] = parse(reduceSource).body[0].expression);
        reduce = (val, entry, i) => evaluate(reduceAst, {val, entry, i});
      }
    }

    // Prepare the index.
    const index = indexService.getIndex({
      name: indexName || queryPart.indexName,
      idFilter: idFilter || (queryPart.idFilter ? new RegExp(queryPart.idFilter) : null),
      map,
      orderBy,
      descending: typeof(descending) === 'boolean' ? descending : !!queryPart.descending
    });

    // Check if there's a page number on the query string.
    const pageParameter = queryPart.pageParameter || 'p';
    let page = request.query[pageParameter];
    page = (page ? parseInt(page, 10) - 1 : queryPart.page) || 0;

    // Page size is 10 by default, and must be explicitly set to 0 to disable pagination.
    const pageSize = queryPart.hasOwnProperty('pageSize') ? queryPart.pageSize : 10;

    // Prepare the callback.
    const partName = context.partName;
    const callback = function indexReduced(reduced) {
      // Change the part into a proper shape
      queryPart.meta = {
        type: 'search-results',
        name: partName + '-results',
        alternates: [
          'search-results-' + partName,
          'search-results-' + queryPart.indexName,
          'search-results-' + partName + '-' + queryPart.indexName
        ]
      };
      queryPart.temp = {
        displayType: context.displayType,
        item: context.item
      };
      // Set the reduced results
      queryPart.results = reduced;
      shapes.push(queryPart);
      // If no pagination, because it's been configured that way,
      // or because there's a reduce function, we're done.
      if (pageSize === 0 || queryPart.reduce) {done();return;}
      // Create a pagination shape
      function pushPaginationShape(count) {
        if (pageSize >= count) {done();return;}
        shapes.push({
          meta: {
            type: 'pagination',
            name: partName + '-pagination',
            alternates: [
              'pagination-' + partName,
              'pagination-' + queryPart.indexName,
              'pagination-' + partName + '-' + queryPart.indexName
            ]
          },
          temp: {
            displayType: context.displayType,
            item: context.item
          },
          page: page,
          pageSize: pageSize,
          count: count,
          pageCount: Math.ceil(count / pageSize),
          path: request.path,
          query: request.query,
          pageParameter: pageParameter,
          displayPages: !!queryPart.displayPages,
          displayNextPrevious: !!queryPart.displayNextPrevious,
          displayFirstLast: !!queryPart.displayFirstLast
        });
        done();
      }
      if (where) {
        // We need to count index entries that satisfy the where clause.
        index.reduce({
            reduce: function countEntries(val) {return val + 1;},
            where: where,
            initialValue: 0
          },
          countWhere => pushPaginationShape(countWhere)
        );
      }
      else {
        // Count the whole index.
        pushPaginationShape(index.getLength());
      }
    };
    if (reduce) {
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
  }
};

module.exports = QueryPart;