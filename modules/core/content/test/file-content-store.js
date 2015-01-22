// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');

var files = {
  'foo/content/index.json':   '{"title":"Home"}',
  'foo/content/bar/baz.json': '{"title":"Foo","body":{"src":"baz.md"},"meta":{"type":"other-type"}}',
  'foo/content/bar/baz.md':   '*markdown*',
  'foo/content/bar/yaml.yaml':
    'title: Foo YAML\r\n' +
    'body:\r\n' +
    '  src: yaml.md\r\n',
  'foo/content/bar/yaml.md':   'YAML *markdown*',
  'foo/content/bar/multipart.yaml.md':
    'title: Foo multipart\r\n\r\n' +
    '-8<------------\r\n\r\n' +
    'multipart *markdown*\r\n',
  'foo/alt/foo.json': '{"body": "alt body"}'
};

var stubs = {
  fs: {
    readFile: function readFile(fileName, callback) {
      var p = fileName.split(path.sep).join('/');
      if (files.hasOwnProperty(p)) {callback(null, files[p]);return;}
      if (p === 'foo/content/error.json') {callback(new Error('error'));return;}
      // File not found
      callback({code: 'ENOENT'});
    },
    existsSync: function(fileName) {
      var p = fileName.split(path.sep).join('/');
      return files.hasOwnProperty(p) || p === 'foo/content/error.json';
    },
    '@noCallThru': true
  }
};

var fileContentStore = proxyquire('../services/file-content-store', stubs);

var scope = {
  require: function require(serviceName) {
    return services[serviceName];
  },
  getServices: function(serviceName) {
    if (!services.hasOwnProperty(serviceName)) return [];
    return [services[serviceName]];
  }
};

var services = {
  shape: {
    temp: function(shape) {
      return shape.temp = shape.temp || {};
    }
  },
  shell: {
    rootPath: 'foo'
  },
  "id-to-path-map": new (require('../services/content-path-mapper'))(scope)
};

describe('File Content Store', function() {
  it('can load JSON content items and satellite Markdown files from the file system', function(done) {
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
      expect(items['/'].meta.type).to.equal('page');
      expect(items['/bar/baz'].title).to.equal('Foo');
      expect(items['/bar/baz'].meta.type).to.equal('other-type');
      expect(items['/bar/baz'].body._data).to.equal('*markdown*');
      done();
    });
  });

  it('can load YAML content items and satellite Markdown files from the file system', function(done) {
    var items = {};
    var itemIdsRead = [];
    var itemCallback = function(err, item) {
      itemIdsRead.push(item.id);
    };
    var payload = {
      scope: scope,
      items: items,
      itemsToFetch: {
        '/bar/yaml': [itemCallback]
      }
    };

    fileContentStore.loadItems(payload, function() {
      expect(itemIdsRead)
        .to.deep.equal(['/bar/yaml']);
      expect(items['/bar/yaml'].title).to.equal('Foo YAML');
      expect(items['/bar/yaml'].body._data).to.equal('YAML *markdown*');
      done();
    });
  });

  it('can load content items from multipart files', function(done) {
    var items = {};
    var itemIdsRead = [];
    var itemCallback = function(err, item) {
      itemIdsRead.push(item.id);
    };
    var payload = {
      scope: scope,
      items: items,
      itemsToFetch: {
        '/bar/multipart': [itemCallback]
      }
    };

    fileContentStore.loadItems(payload, function() {
      expect(itemIdsRead)
        .to.deep.equal(['/bar/multipart']);
      expect(items['/bar/multipart'].title).to.equal('Foo multipart');
      expect(items['/bar/multipart'].body._data).to.equal('multipart *markdown*');
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