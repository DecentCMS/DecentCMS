// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');

function clearIndexOrderCache(index) {
  index.forEach(function(entry) {delete entry._order;});
}

describe('Index', function() {
  var Index = require('../services/index');
  it('can get indexes by map function and order', function() {
    var theMap = null;
    var theOrder = null;
    var theIdFilter = null;
    var scope = {
      require: function(service) {
        if (service === 'index-store') return {
          getIndex: function(idFilter, map, orderBy) {
            theIdFilter = idFilter;
            theMap = map;
            theOrder = orderBy;
          }
        };
        return null;
      }
    };

    var index = new Index(scope);
    var myIdFilter = /foo/;
    var myMap = function map() {};
    var myOrderBy = function orderBy() {};
    index.getIndex({
      idFilter: myIdFilter,
      map: myMap,
      orderBy: myOrderBy
    });

    expect(theIdFilter).to.equal(myIdFilter);
    expect(theMap).to.equal(myMap);
    expect(theOrder).to.equal(myOrderBy);
  });
});

describe('File Index', function() {
  // Variables that tests can change and check:
  // Check this to know what directories the code tried to create.
  var newDir = null;
  // Check this to know what files the code tried to write.
  var newFiles = {};
  // Set to true so indexes can be found on disk.
  var indexExists = false;
  // Current item being read.
  var i = 1;
  // Number of items in the store.
  var nbItems = 3;

  var shell = {
    rootPath: 'site'
  };
  var fs = {
    existsSync: function() {return indexExists;},
    mkdirSync: function(path) {newDir = path;},
    writeFileSync: function(path, data) {newFiles[path] = data;},
    '@noCallThru': true
  };
  var stubs = {
    fs: fs
  };
  // The file index factory class
  var FileIndexFactory = proxyquire('../services/file-index', stubs);
  // Gets the path for an index
  function indexPath(map, orderBy) {
    return path.resolve(
      shell.rootPath,
      'index',
      FileIndexFactory._toName(map, orderBy))
      + '.json';
  }
  // Order by function that will return the items starting
  // with the second, then adds the first to the end.
  var orderBy = function orderByIndexOffByOne(item) {
    return (item.index + 1) % nbItems;
  };
  // A map function that returns null
  var mapNull = function mapNull() {return null;};
  var nullPath = indexPath(mapNull, orderBy);
  stubs[nullPath] = {
    val: 'null index cache',
    '@noCallThru': true
  };
  // A map function that returns a single entry
  var mapSingleEntry = function mapSingleEntry(item) {
    return {indexedFoo: 'foo' + item.id, index: item.index};
  };
  var singlePath = indexPath(mapSingleEntry, orderBy);
  stubs[singlePath] = {
    val: 'single index cache',
    '@noCallThru': true
  };
  // A map function that returns two entries per item
  var mapMultipleEntries = function mapMultipleEntries(item) {
    return [
      {indexedFoo: 'foo' + item.id, index: item.index},
      {indexedFoo: 'bar' + item.id, index: item.index}
    ];
  };
  var multiplePath = indexPath(mapMultipleEntries, orderBy);
  stubs[multiplePath] = {
    val: 'multiple index cache',
    '@noCallThru': true
  };
  // Stub services
  var services = {
    shell: shell,
    log: {info: function() {}},
    'content-enumerator': {
      getItemEnumerator: function(context) {
        return function(iterator) {
          var id = 'item' + i;
          while(context.idFilter
            && context.idFilter.test
            && !context.idFilter.test(id)
            && i <= nbItems) {
            i++;
            id = 'item' + i;
          }
          if (i <= nbItems) {
            iterator(null, {id: id, index: i++});
          }
          else {
            iterator();
          }
        };
      }
    }
  };
  var scope = {
    require: function(service) {return services[service];},
    getServices: function(service) {return [services[service]];}
  };
  var indexFactory = new FileIndexFactory(scope);

  beforeEach(function() {
    newDir = null;
    newFiles = {};
    indexExists = false;
    i = 1;
    nbItems = 3;
    indexFactory.indexes = {};
  });

  it("builds the index if it doesn't exist on disk", function(done) {
    var index = indexFactory.getIndex(mapNull, orderBy);

    process.nextTick(function() {
      expect(newDir).to.equal(path.resolve(shell.rootPath, 'index'));
      expect(newFiles[nullPath]).to.equal('[]');
      expect(index._index).to.deep.equal([]);
      expect(index._unsortedIndex).to.not.be.ok;
      done();
    });
  });

  it("yields the same index for the same id filter, map, and order", function() {
    var indexA = indexFactory.getIndex('foo', mapNull, orderBy);
    var indexB = indexFactory.getIndex('foo', mapNull, orderBy);

    expect(indexA).to.equal(indexB);
  });

  it("yields the same index for the same name, but different map and order", function() {
    var indexA = indexFactory.getIndex('foo', mapNull, orderBy, 'index-name');
    var indexB = indexFactory.getIndex('bar', function() {}, function() {}, 'index-name');

    expect(indexA).to.equal(indexB);
  });

  it("loads the index from disk if the file exists", function() {
    indexExists = true;
    var index = indexFactory.getIndex(null, mapNull, orderBy);

    expect(index._index.val).to.equal('null index cache');
  });

  it("builds the index from content items in the right order", function(done) {
    var index = indexFactory.getIndex(null, mapSingleEntry, orderBy);

    process.nextTick(function() {
      clearIndexOrderCache(index._index);
      expect(index._index).to.deep.equal([
        {indexedFoo: 'fooitem2', itemId: 'item2', index: 2},
        {indexedFoo: 'fooitem3', itemId: 'item3', index: 3},
        {indexedFoo: 'fooitem1', itemId: 'item1', index: 1}
      ]);
      done();
    });
  });

  it("can order by multiple criteria", function(done) {
    var index = indexFactory.getIndex(mapSingleEntry, function multipleOrderBy(item) {
      return [1, 'a', item.index % 2, item.index];
    });

    process.nextTick(function() {
      clearIndexOrderCache(index._index);
      expect(index._index).to.deep.equal([
        {indexedFoo: 'fooitem2', itemId: 'item2', index: 2},
        {indexedFoo: 'fooitem1', itemId: 'item1', index: 1},
        {indexedFoo: 'fooitem3', itemId: 'item3', index: 3}
      ]);
      done();
    });
  });

  it("can get multiple entries from each item", function(done) {
    var index = indexFactory.getIndex(mapMultipleEntries, orderBy);

    process.nextTick(function() {
      clearIndexOrderCache(index._index);
      expect(index._index).to.deep.equal([
        {indexedFoo: 'fooitem2', itemId: 'item2', index: 2},
        {indexedFoo: 'baritem2', itemId: 'item2', index: 2},
        {indexedFoo: 'fooitem3', itemId: 'item3', index: 3},
        {indexedFoo: 'baritem3', itemId: 'item3', index: 3},
        {indexedFoo: 'fooitem1', itemId: 'item1', index: 1},
        {indexedFoo: 'baritem1', itemId: 'item1', index: 1}
      ]);
      done();
    });
  });

  it("can filter ids", function(done) {
    var index = indexFactory.getIndex(
      /^item(2|1)$/, mapSingleEntry, orderBy);

    process.nextTick(function() {
      clearIndexOrderCache(index._index);
      expect(index._index).to.deep.equal([
        {indexedFoo: 'fooitem2', itemId: 'item2', index: 2},
        {indexedFoo: 'fooitem1', itemId: 'item1', index: 1}
      ]);
      done();
    });
  });

  it('can filter the index', function(done) {
    var index = indexFactory.getIndex(mapMultipleEntries, orderBy);

    process.nextTick(function() {
      clearIndexOrderCache(index._index);
      index.filter({
        where: function (entry) {
          return entry.indexedFoo.substr(0, 3) === 'bar';
        }
      }, function(entries) {
        expect(entries).to.deep.equal([
          {indexedFoo: 'baritem2', itemId: 'item2', index: 2},
          {indexedFoo: 'baritem3', itemId: 'item3', index: 3},
          {indexedFoo: 'baritem1', itemId: 'item1', index: 1}
        ]);
        done();
      });
    });
  });

  it('can specify a start index for a filtered index', function(done) {
    var index = indexFactory.getIndex(mapMultipleEntries, orderBy);

    process.nextTick(function() {
      clearIndexOrderCache(index._index);
      index.filter({
        where: function (entry) {
          return entry.indexedFoo.substr(0, 3) === 'bar';
        },
        start: 1
      }, function(entries) {
        expect(entries).to.deep.equal([
          {indexedFoo: 'baritem3', itemId: 'item3', index: 3},
          {indexedFoo: 'baritem1', itemId: 'item1', index: 1}
        ]);
        done();
      });
    });
  });

  it('can specify a range for a filtered index', function(done) {
    var index = indexFactory.getIndex(mapMultipleEntries, orderBy);

    process.nextTick(function() {
      clearIndexOrderCache(index._index);
      index.filter({
        where: function (entry) {
          return entry.index < 3;
        }
        , start: 1, count: 2
      }, function(entries) {
        expect(entries).to.deep.equal([
          {indexedFoo: 'baritem2', itemId: 'item2', index: 2},
          {indexedFoo: 'fooitem1', itemId: 'item1', index: 1}
        ]);
        done();
      });
    });
  });

  it('can reduce an index', function(done) {
    var index = indexFactory.getIndex(mapMultipleEntries, orderBy);

    process.nextTick(function() {
      index.reduce({
        reduce: function (val, entry) {
          return val + entry.index;
        },
        initialValue: 0
        },
        function (aggregated) {
          expect(aggregated).to.equal(12);
          done();
        }
      );
    });
  });

  it('can filter while reducing', function(done) {
    var index = indexFactory.getIndex(mapMultipleEntries, orderBy);

    process.nextTick(function() {
      index.reduce({
          where: function (entry) {
            return entry.itemId === 'item3';
          },
          reduce: function (val, entry) {
            return val + entry.index;
          },
          initialValue: 0
        },
        function(aggregated) {
          expect(aggregated).to.equal(6);
          done();
        }
      );
    });
  });

  it('can add a new item', function(done) {
    var index = indexFactory.getIndex(mapSingleEntry, orderBy);

    process.nextTick(function() {
      index._unsortedIndex = [
        {indexedFoo: 'fooitem1', itemId: 'item1', index: 1},
        {indexedFoo: 'fooitem2', itemId: 'item2', index: 2}
      ];

      index.updateWith({id: 'item6', index: 6});
      clearIndexOrderCache(index._index);
      clearIndexOrderCache(index._unsortedIndex);

      expect(index._index).to.deep.equal([
        {indexedFoo: 'fooitem2', itemId: 'item2', index: 2},
        {indexedFoo: 'fooitem3', itemId: 'item3', index: 3},
        {indexedFoo: 'fooitem6', itemId: 'item6', index: 6},
        {indexedFoo: 'fooitem1', itemId: 'item1', index: 1}
      ]);
      expect(index._unsortedIndex).to.deep.equal([
        {indexedFoo: 'fooitem1', itemId: 'item1', index: 1},
        {indexedFoo: 'fooitem2', itemId: 'item2', index: 2}
      ]);
      done();
    });
  });

  it('can modify an existing item', function(done) {
    var index = indexFactory.getIndex(mapSingleEntry, orderBy);

    process.nextTick(function() {
      index._unsortedIndex = [
        {indexedFoo: 'olditem1', itemId: 'item1', index: 1},
        {indexedFoo: 'olditem2', itemId: 'item2', index: 2},
        {indexedFoo: 'olditem3', itemId: 'item3', index: 3}
      ];
      index._index.forEach(function(oldItem) {oldItem.indexedFoo = 'old';});

      index.updateWith({id: 'item2', index: 2});
      clearIndexOrderCache(index._index);
      clearIndexOrderCache(index._unsortedIndex);

      expect(index._index).to.deep.equal([
        {indexedFoo: 'fooitem2', itemId: 'item2', index: 2},
        {indexedFoo: 'old', itemId: 'item3', index: 3},
        {indexedFoo: 'old', itemId: 'item1', index: 1}
      ]);
      expect(index._unsortedIndex).to.deep.equal([
        {indexedFoo: 'olditem1', itemId: 'item1', index: 1},
        {indexedFoo: 'olditem3', itemId: 'item3', index: 3},
        {indexedFoo: 'fooitem2', itemId: 'item2', index: 2}
      ]);
      done();
    });
  });

  it('can remove an item', function(done) {
    var index = indexFactory.getIndex(mapMultipleEntries, orderBy);

    process.nextTick(function() {
      index._unsortedIndex = [
        {indexedFoo: 'olditem1', itemId: 'item1', index: 1},
        {indexedFoo: 'olditem2', itemId: 'item2', index: 2},
        {indexedFoo: 'olditem3', itemId: 'item3', index: 3}
      ];

      index.remove({id: 'item2', index: 2});
      clearIndexOrderCache(index._index);
      clearIndexOrderCache(index._unsortedIndex);

      expect(index._index).to.deep.equal([
        {indexedFoo: 'fooitem3', itemId: 'item3', index: 3},
        {indexedFoo: 'baritem3', itemId: 'item3', index: 3},
        {indexedFoo: 'fooitem1', itemId: 'item1', index: 1},
        {indexedFoo: 'baritem1', itemId: 'item1', index: 1}
      ]);
      expect(index._unsortedIndex).to.deep.equal([
        {indexedFoo: 'olditem1', itemId: 'item1', index: 1},
        {indexedFoo: 'olditem3', itemId: 'item3', index: 3}
      ]);
      done();
    });
  });

  it('can monitor progress of indexing', function(done) {
    var index = indexFactory.getIndex(mapMultipleEntries, orderBy);

    process.nextTick(function() {
      index._unsortedIndex = [
        {indexedFoo: 'olditem1', itemId: 'item1', index: 1},
        {indexedFoo: 'olditem2', itemId: 'item2', index: 2},
        {indexedFoo: 'olditem3', itemId: 'item3', index: 3}
      ];

      expect(index.getLength()).to.equal(6);
      expect(index.getProgress()).to.equal(3);
      done();
    });
  });

  it('shows index length if no indexing in progress', function(done) {
    var index = indexFactory.getIndex(mapMultipleEntries, orderBy);

    process.nextTick(function() {
      expect(index.getLength()).to.equal(6);
      expect(index.getProgress()).to.equal(6);
      done();
    });
  });
});