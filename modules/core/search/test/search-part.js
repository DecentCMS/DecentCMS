// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

describe('Search part', function() {
  var items = [
    {id: 1, title: 'one'},
    {id: 2, title: 'two'},
    {id: 3, title: 'three'},
    {id: 4, title: 'four'},
    {id: 5, title: 'five'},
    {id: 6, title: 'six'},
    {id: 7, title: 'seven'},
    {id: 8, title: 'eight'},
    {id: 9, title: 'nine'},
    {id: 10, title: 'ten'}
  ];

  function buildIndex(map, orderBy) {
    var result = [];
    items.forEach(function(item) {
      var mapped = map(item);
      result = result.concat(mapped);
    });
    return result.sort(function(a, b) {
      var orderA = orderBy(a);
      var orderB = orderBy(b);
      return orderA > orderB ? 1 : orderA == orderB ? 0 : -1;
    });
  }

  var index = {
    getIndex: function(options) {
      return {
        options: options,
        getLength: function() {
          return buildIndex(options.map, options.orderBy).length;
        },
        filter: function(filterOptions, done) {
          var indexEntries = buildIndex(options.map, options.orderBy);
          if (filterOptions.where) {
            indexEntries = indexEntries.filter(filterOptions.where);
          }
          if (filterOptions.count > 0) {
            done(indexEntries
              .slice(filterOptions.start, filterOptions.start + filterOptions.count));
          }
          else {
            done(indexEntries);
          }
        },
        reduce: function(reduceOptions, done) {
          var filtered = buildIndex(options.map, options.orderBy)
            .filter(reduceOptions.where);
          done(filtered.reduce(reduceOptions.reduce, reduceOptions.initialValue));
        }
      }
    }
  };

  var contentManager = {
    getParts: function(item, partType) {return [partType];}
  };

  var request = {
    path: 'foo/bar',
    query: {}
  };

  var services = {
    'content-manager': contentManager,
    index: index,
    shell: {},
    request: request
  };

  var scope = {
    require: function(service) {
      return services[service];
    }
  };

  var SearchPart = require('../services/search-part');

  it("Can return a filtered list of entries", function(done) {
    var context = {
      shape: {
        meta: {type: 'content'},
        temp: {shapes: [], displayType: 'main'},
        search: {
          indexName: 'idx',
          idFilter: 'exp',
          map: '{foo: item.title, id: item.id}',
          where: 'entry.foo[0] === "t"',
          orderBy: 'entry.foo',
          pageSize: 0
        }
      },
      scope: scope
    };
    context.shape.temp.item = context.shape;

    SearchPart.handle(context, function() {
      expect(context.shape.temp.shapes).to.deep.equal([
        {
          meta: {
            alternates: ["search-results-search", "search-results-idx", "search-results-search-idx"],
            item: context.shape,
            name: "search",
            type: "search-results"
          },
          temp: {displayType: "main"},
          idFilter: "exp",
          indexName: "idx",
          map: "{foo: item.title, id: item.id}",
          where: 'entry.foo[0] === "t"',
          orderBy: "entry.foo",
          pageSize: 0,
          result: [
            {id: 10, foo: 'ten'},
            {id: 3, foo: 'three'},
            {id: 2, foo: 'two'}
          ]
        }
      ]);
      done();
    });
  });

  it("Can reduce the index", function(done) {
    var context = {
      shape: {
        meta: {type: 'content'},
        temp: {shapes: [], displayType: 'main'},
        search: {
          indexName: 'idx',
          idFilter: 'exp',
          map: '{id: item.id, foo: item.title}',
          where: 'entry.foo[0] === "t"',
          orderBy: 'entry.id',
          reduce: 'return (val || 0) + entry.id;',
          pageSize: 0
        }
      },
      scope: scope
    };
    context.shape.temp.item = context.shape;

    SearchPart.handle(context, function() {
      expect(context.shape.temp.shapes[0].result).to.equal(15);
      done();
    });
  });

  it("Can paginate filtered results", function(done) {
    var context = {
      shape: {
        meta: {type: 'content'},
        temp: {shapes: [], displayType: 'main'},
        search: {
          indexName: 'idx',
          idFilter: 'exp',
          map: '{id: item.id, foo: item.title}',
          where: 'entry.id > 2',
          orderBy: 'entry.foo',
          pageSize: 3,
          page: 1,
          displayPages: true
        }
      },
      scope: scope
    };
    context.shape.temp.item = context.shape;

    SearchPart.handle(context, function() {
      expect(context.shape.temp.shapes[0].result).to.deep.equal([
        {id: 9, foo: 'nine'},
        {id: 7, foo: 'seven'},
        {id: 6, foo: 'six'}
      ]);
      expect(context.shape.temp.shapes[1]).to.deep.equal({
        meta: {
          type: 'pagination',
          name: 'search',
          alternates: ['pagination-search', 'pagination-idx', 'pagination-search-idx'],
          item: context.shape
        },
        temp: {displayType: 'main'},
        page: 1,
        pageSize: 3,
        count: 8,
        pageCount: 3,
        path: 'foo/bar',
        query: {},
        pageParameter: 'p',
        displayPages: true,
        displayNextPrevious: false,
        displayFirstLast: false
      });
      done();
    });
  });

  it("Can paginate unfiltered results", function(done) {
    var context = {
      shape: {
        meta: {type: 'content'},
        temp: {shapes: [], displayType: 'main'},
        search: {
          indexName: 'idx',
          idFilter: 'exp',
          map: '{id: item.id, foo: item.title}',
          orderBy: 'entry.foo',
          pageSize: 3,
          page: 1,
          displayPages: true
        }
      },
      scope: scope
    };
    context.shape.temp.item = context.shape;

    SearchPart.handle(context, function() {
      expect(context.shape.temp.shapes[0].result).to.deep.equal([
        {id: 9, foo: 'nine'},
        {id: 1, foo: 'one'},
        {id: 7, foo: 'seven'}
      ]);
      expect(context.shape.temp.shapes[1]).to.deep.equal({
        meta: {
          type: 'pagination',
          name: 'search',
          alternates: ['pagination-search', 'pagination-idx', 'pagination-search-idx'],
          item: context.shape
        },
        temp: {displayType: 'main'},
        page: 1,
        pageSize: 3,
        count: 10,
        pageCount: 4,
        path: 'foo/bar',
        query: {},
        pageParameter: 'p',
        displayPages: true,
        displayNextPrevious: false,
        displayFirstLast: false
      });
      done();
    });
  });
});