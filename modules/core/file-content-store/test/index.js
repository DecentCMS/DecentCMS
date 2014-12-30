// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');

var rootContentPath = path.join('foo', 'content');

var stubs = {
  fs: {
    readFile: function readFile(fileName, callback) {
      switch(fileName) {
        case path.join(rootContentPath, 'index.json'):
          callback(null, '{"title":"Home"}');
          return;
        case path.join(rootContentPath, 'bar', 'baz.json'):
          callback(null, '{"title":"Foo","body":{"src":"baz.md"}}');
          return;
        case path.join(rootContentPath, 'bar', 'baz.md'):
          callback(null, '*markdown*');
          return;
        case path.join('foo', 'data', 'alt', 'foo.json'):
          callback(null, '{"body": "alt body"}');
          return;
        case path.join(rootContentPath, 'error.json'):
          callback(new Error('error'));
          return;
        default:
          // File not found
          callback({code: 'ENOENT'});
      }
    },
    '@noCallThru': true
  }
};

var fileContentStore = proxyquire('../services/file-content-store', stubs);

var scope = {
  require: function require(serviceName) {
    switch(serviceName) {
      case 'shape':
        return {
          temp: function(shape) {
            return shape.temp = shape.temp || {};
          }
        };
      case 'shell':
        return {
          rootPath: 'foo'
        };
    }
  }
};

describe('File Content Store', function() {
  it('can load content items from the file system', function(done) {
    var items = {};
    var itemIdsRead = [];
    var itemCallback = function(err, item) {
      itemIdsRead.push(item.id);
    };
    var payload = {
      scope: scope,
      items: items,
      itemsToFetch: {
        '/': [itemCallback],
        '/bar/baz': [itemCallback, itemCallback]
      }
    };

    fileContentStore.loadItems(payload, function() {
      expect(itemIdsRead)
        .to.deep.equal(['/', '/bar/baz', '/bar/baz']);
      expect(items['/'].title).to.equal('Home');
      expect(items['/bar/baz'].title).to.equal('Foo');
      expect(items['/bar/baz'].body._data).to.equal('*markdown*');
      done();
    });
  });

  it('can load content items from alternative roots', function(done) {
    var items = {};
    var payload = {
      scope: scope,
      items: items,
      itemsToFetch: {
        'alt:foo': []
      }
    };

    fileContentStore.loadItems(payload, function() {
      expect(items['alt:foo'].body).to.equal('alt body');
      done();
    });
  });

  it('transmits errors to callbacks', function(done) {
    var payload = {
      scope: scope,
      items: {},
      itemsToFetch: {
        'error': []
      }
    };

    fileContentStore.loadItems(payload, function(err) {
      expect(err.message).to.equal('error');
      done();
    });
  });

  it("does nothing for items it can't find", function(done) {
    var payload = {
      scope: scope,
      items: {},
      itemsToFetch: {
        doesntExist: []
      }
    };

    fileContentStore.loadItems(payload, function(err) {
      expect(err).to.not.be.ok;
      expect(payload.itemsToFetch.doesntExist).to.be.ok;
      expect(payload.items.doesntExist).to.not.be.ok;
      done();
    });
  });
});