// DecentCMS (c) 2018 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: allow the parsed ASTs to be persisted on the part. This will allow the parsing to be done at edit time, thus saving runtime processing.

/**
 * A content part that can query a full-text search index and present the results.
 */
const SearchPart = {
  feature: 'search-part',
  service: 'search-part-handler',
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
   *  [definition]          | `string`  | The name of an index definition to get from index definition providers and to replace direct specification of id filter, fields, map, where and name.
   *  [idFilter]            | `string`  | A filter regular expression to apply to item ids before they are handed to the indexing process.
   *  map                   | `string`  | A mapping expression for the index. It can refer to the passed-in content item as `item`. It can evaluate as null, an object, or an array of objects.
   *  [where]               | `string`  | A where expression. It can refer to the index entry to filter as `entry`. It evaluates as a Boolean.
   *  [page]                | `number`  | The 0-based page number to display. The default is 0. The page number will be overwritten with the value from the querystring if there is one.
   *  [pageSize]            | `number`  | The size of the page. If zero, all results are shown. The default value is 10.
   *  [pageParameter]       | `string`  | The name for the pagination parameter that will be added to the querystring on pagination. The default is 'p'. Using different page parameter names enables multiple search results to have independent pagination.
   *  [queryParameter]      | `string`  | The name for the querystring parameter for the query. The default is 'q'. Using different query parameter names enables multiple search results on the same page to have independent queries.
   *  [displayPages]        | `Boolean` | True if page numbers should be displayed in pagination.
   *  [displayNextPrevious] | `Boolean` | True if pagination should have next and previous buttons.
   *  [displayFirstLast]    | `Boolean` | True if buttons to go to the first and last pages should be displayed by pagination.
   *
   * @param {object} context The context object.
   * @param {object} context.part The text part to handle.
   * @param {string} context.partName The name of the part.
   * @param {string} context.displayType The display type.
   * @param {object} context.item A reference to the content item.
   * @param {Array} context.shapes The shapes array to which new shapes must be pushed.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: (context, done) => {
    const shapes = context.shapes;
    if (!shapes) {done();return;}
    const scope = context.scope;

    // find the search engine service, return if there isn't one.
    const searchEngine = scope.require('search-engine');
    if (!searchEngine) {done();return;}

    // Prepare dependencies.
    const request = scope.require('request');
    const searchPart = context.part;
    const partName = context.partName;
    
    
    // Is there an index definition name?
    let indexName, idFilter, fields, map, where;
    const definitionName = searchPart.definition;
    if (definitionName) {
      const indexDefinitionProvider = scope.require('index-definition-provider');
      if (indexDefinitionProvider) {
        const definition = indexDefinitionProvider.getDefinition(definitionName);
        if (definition) {
          if (definition.name) indexName = definition.name;
          if (definition.idFilter) idFilter = definition.idFilter;
          if (definition.fields) fields = definition.fields;
          if (definition.map) map = definition.map;
          if (definition.where) where = definition.where;
        }
      }
    }

    if (!map || (!where && searchPart.where)) {
      const shell = scope.require('shell');
      const astCache = shell['ast-cache'] || (shell['ast-cache'] = {});
      const evaluate = require('static-eval');
      const parse = require('esprima').parse;
      if (!map) {
        // Prepare an AST for the mapping function.
        const mapSource = '(' + (searchPart.map || '{}') + ')';
        const mapAst = astCache[mapSource] || (astCache[mapSource] = parse(mapSource).body[0].expression);
        map = item => evaluate(mapAst, {item});
      }
      if (searchPart.where) {
        // Prepare the AST for the where function.
        const whereSource = '(' + searchPart.where + ')';
        const whereAst = astCache[whereSource] || (astCache[whereSource] = parse(whereSource).body[0].expression);
        where = entry => evaluate(whereAst, {entry});
      }
    }
    // Prepare the index.
    const index = searchEngine.getIndex(
      idFilter || (searchPart.idFilter ? new RegExp(searchPart.idFilter) : null),
      map,
      indexName || searchPart.indexName,
      fields || searchPart.fields
    );
    // Get the query.
    const queryParameter = searchPart.queryParameter || 'q';
    const query = request.query[queryParameter];
    // Check if there's a page number on the query string.
    const pageParameter = searchPart.pageParameter || 'p';
    let page = request.query[pageParameter];
    page = (page ? parseInt(page, 10) - 1 : searchPart.page) || 0;
    // Page size is 10 by default, and must be explicitly set to 0 to disable pagination.
    const pageSize = searchPart.hasOwnProperty('pageSize')
      ? searchPart.pageSize
      : 10;
    index.search({
      query, where, start: pageSize * page, count: pageSize
    }, results => {
      // Change the part into a proper shape
      searchPart.meta = {
        type: 'search-results',
        name: partName + '-results',
        alternates: [
          'search-results-' + partName,
          'search-results-' + searchPart.indexName,
          'search-results-' + partName + '-' + searchPart.indexName
        ]
      };
      searchPart.temp = {
        displayType: context.displayType,
        item: context.item
      };
      // Set the results
      searchPart.results = results;
      shapes.push(searchPart);
      // If no pagination, because it's been configured that way,
      // or because there's a reduce function, we're done.
      if (pageSize === 0 || searchPart.reduce) {done();return;}
      // Create a pagination shape
      if (pageSize >= results.totalCount) {done();return;}
      shapes.push({
        meta: {
          type: 'pagination',
          name: partName + '-pagination',
          alternates: [
            'pagination-' + partName,
            'pagination-' + searchPart.indexName,
            'pagination-' + partName + '-' + searchPart.indexName
          ]
        },
        temp: {
          displayType: context.displayType,
          item: context.item
        },
        page: page,
        pageSize: pageSize,
        count: results.totalCount,
        pageCount: Math.ceil(results.totalCount / pageSize),
        path: request.path,
        query: request.query,
        pageParameter: pageParameter,
        displayPages: !!searchPart.displayPages,
        displayNextPrevious: !!searchPart.displayNextPrevious,
        displayFirstLast: !!searchPart.displayFirstLast
      });
      done();
    });
  }
};

module.exports = SearchPart;