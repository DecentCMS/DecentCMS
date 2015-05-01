// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');

// Define a fake file system's hierarchy.
var fileSystem = {
  name: '',
  items: [
    {name: 'foo', items: [
      {name: 'content', items: [
        {name: 'index.json', data: '{"title":"Home"}'},
        {name: 'bar', items: [
          {name: 'baz.json', data: '{"title":"Foo","body":{"src":"baz.md"},"meta":{"type":"other-type"}}'},
          {name: 'baz.md', data: '*markdown*'},
          {name: 'yaml.yaml', data:
          'title: Foo YAML\r\n' +
          'body:\r\n' +
          '  src: yaml.md\r\n'},
          {name: 'yaml.md', data: 'YAML *markdown*'},
          {name: 'multipart.yaml.md', data:
          'title: Foo multipart\r\n\r\n' +
          '-8<------------\r\n\r\n' +
          'multipart *markdown*\r\n'}
        ]}
      ]},
      {name: 'alt', items: [
        {name: 'foo.json', data: '{"body": "alt body"}'}
      ]}
    ]}
  ]
};
// Map that onto a dictionary of path to file contents.
var files = {};
function buildFiles(folder) {
  var items = folder.items;
  folder.path = folder.parent && folder.parent.path
    ? folder.parent.path + '/' + folder.name
    : folder.name;
  items.forEach(function(item) {
    if (item.data) {
      files[folder.path + '/' + item.name] = item.data;
    }
    else {
      item.parent = folder;
      buildFiles(item);
    }
  });
}
buildFiles(fileSystem);

var root = path.resolve('');
function resolve(dirPath) {
  if (dirPath.substr(0, root.length) === root) dirPath = dirPath.substr(root.length);
  if (dirPath[0] === path.sep) dirPath = dirPath.substr(1);
  var p = dirPath.split(path.sep);
  var dir = fileSystem;
  for (var i = 0; i < p.length; i++) {
    var sub = p[i];
    if (!dir.items) continue;
    for (var j = 0; j < dir.items.length; j++) {
      if (dir.items[j].name === sub) {
        dir = dir.items[j];
        break;
      }
    }
  }
  return dir;
}

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
    readdirSync: function(dirPath) {
      var dir = resolve(dirPath);
      return dir.items.map(function(item) {return item.name;});
    },
    statSync: function(fileOrFolderPath) {
      var fileOrFolder = resolve(fileOrFolderPath);
      return fileOrFolder.items
        ? {isDirectory: function() {return true;}, isFile: function() {return false;}}
        : {isDirectory: function() {return false;}, isFile: function() {return true;}};
    },
    '@noCallThru': true
  }
};

var fileContentStore = proxyquire('../services/file-content-store', stubs);
var fileContentEnumerator = proxyquire('../services/file-content-enumerator', stubs);

var scope = {
  require: function require(serviceName) {
    return services[serviceName];
  },
  getServices: function(serviceName) {
    if (!services.hasOwnProperty(serviceName)) return [];
    return [services[serviceName]];
  },
  callService: function(serviceName, methodName, context, done) {
    services[serviceName][methodName](context, done);
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
  "id-to-path-map": new (require('../services/content-path-mapper'))(scope),
  "content-file-parser": require('../services/json-yaml-md-file-parser'),
  "content-store": fileContentStore,
  log: {
    error: function() {}
  }
};

describe('File Content Store', function() {
  it('can load JSON content items and satellite Markdown files from the file system', function (done) {
    var items = {};
    var itemIdsRead = [];
    var itemCallback = function (err, item) {
      itemIdsRead.push(item.id);
    };
    var context = {
      scope: scope,
      items: items,
      itemsToFetch: {
        '/': [itemCallback],
        '/bar/baz': [itemCallback, itemCallback]
      }
    };

    fileContentStore.loadItems(context, function () {
      expect(itemIdsRead)
        .to.deep.equal(['/', '/bar/baz', '/bar/baz']);
      expect(items['/'].title).to.equal('Home');
      expect(items['/'].meta.type).to.equal('page');
      expect(items['/bar/baz'].title).to.equal('Foo');
      expect(items['/bar/baz'].meta.type).to.equal('other-type');
      expect(items['/bar/baz'].body.text).to.equal('*markdown*');
      done();
    });
  });

  it('can load YAML content items and satellite Markdown files from the file system', function (done) {
    var items = {};
    var itemIdsRead = [];
    var itemCallback = function (err, item) {
      itemIdsRead.push(item.id);
    };
    var context = {
      scope: scope,
      items: items,
      itemsToFetch: {
        '/bar/yaml': [itemCallback]
      }
    };

    fileContentStore.loadItems(context, function () {
      expect(itemIdsRead)
        .to.deep.equal(['/bar/yaml']);
      expect(items['/bar/yaml'].title).to.equal('Foo YAML');
      expect(items['/bar/yaml'].body.text).to.equal('YAML *markdown*');
      done();
    });
  });

  it('can load content items from multipart files', function (done) {
    var items = {};
    var itemIdsRead = [];
    var itemCallback = function (err, item) {
      itemIdsRead.push(item.id);
    };
    var context = {
      scope: scope,
      items: items,
      itemsToFetch: {
        '/bar/multipart': [itemCallback]
      }
    };

    fileContentStore.loadItems(context, function () {
      expect(itemIdsRead)
        .to.deep.equal(['/bar/multipart']);
      expect(items['/bar/multipart'].title).to.equal('Foo multipart');
      expect(items['/bar/multipart'].body.text).to.equal('multipart *markdown*');
      done();
    });
  });

  it('can load content items from alternative roots', function (done) {
    var items = {};
    var context = {
      scope: scope,
      items: items,
      itemsToFetch: {
        'alt:foo': []
      }
    };

    fileContentStore.loadItems(context, function () {
      expect(items['alt:foo'].body).to.equal('alt body');
      done();
    });
  });

  it('transmits errors to callbacks', function (done) {
    var context = {
      scope: scope,
      items: {},
      itemsToFetch: {
        'error': []
      }
    };

    fileContentStore.loadItems(context, function (err) {
      expect(err.message).to.equal('error');
      done();
    });
  });

  it("does nothing for items it can't find", function (done) {
    var context = {
      scope: scope,
      items: {},
      itemsToFetch: {
        doesntExist: []
      }
    };

    fileContentStore.loadItems(context, function (err) {
      expect(err).to.not.be.ok;
      expect(context.itemsToFetch.doesntExist).to.be.ok;
      expect(context.items.doesntExist).to.not.be.ok;
      done();
    });
  });
});

describe('File Content Enumerator', function() {
  it('can asynchronously enumerate all items in the store', function(done) {
    var items = {};
    var iterate = fileContentEnumerator.getItemEnumerator({scope: scope});
    var iterator = function(err, item) {
      if (err) throw err;
      if (item) {
        items[item.id] = item;
        iterate(iterator);
      }
      else {
        expect(items).to.deep.equal({
          "/": {
            id: "/",
            meta: {
              type: "page"
            },
            temp: {
              storage: "FileSystem",
              filePath: "foo\\content\\index.json",
              name: "index"
            },
            title: "Home"
          },
          "bar/baz": {
            body: {
              text: "*markdown*",
              src: "baz.md"
            },
            id: "bar/baz",
            meta: {
              type: "other-type"
            },
            temp: {
              storage: "FileSystem",
              filePath: "foo\\content\\bar\\baz.json",
              name: "baz"
            },
            title: "Foo"
          },
          "bar/multipart": {
            body: {
              text: "multipart *markdown*",
              flavor: "markdown"
            },
            id: "bar/multipart",
            meta: {
              type: "page"
            },
            temp: {
              storage: "FileSystem",
              filePath: "foo\\content\\bar\\multipart.yaml.md",
              name: "multipart"
            },
            "title": "Foo multipart"
          },
          "bar/yaml": {
            body: {
              text: "YAML *markdown*",
              src: "yaml.md"
            },
            id: "bar/yaml",
            meta: {
              type: "page"
            },
            temp: {
              storage: "FileSystem",
              filePath: "foo\\content\\bar\\yaml.yaml",
              name: "yaml"
            },
            title: "Foo YAML"
          }
        });
        done();
      }
    };
    iterate(iterator);
  });

  it('can filter ids', function(done) {
    var items = {};
    var iterate = fileContentEnumerator.getItemEnumerator({
      scope: scope,
      idFilter: /^bar\/(baz|yaml)$/
    });
    var iterator = function(err, item) {
      if (err) throw err;
      if (item) {
        items[item.id] = item;
        iterate(iterator);
      }
      else {
        expect(items).to.deep.equal({
          "bar/baz": {
            body: {
              text: "*markdown*",
              src: "baz.md"
            },
            id: "bar/baz",
            meta: {
              type: "other-type"
            },
            temp: {
              storage: "FileSystem",
              filePath: "foo\\content\\bar\\baz.json",
              name: "baz"
            },
            title: "Foo"
          },
          "bar/yaml": {
            body: {
              text: "YAML *markdown*",
              src: "yaml.md"
            },
            id: "bar/yaml",
            meta: {
              type: "page"
            },
            temp: {
              storage: "FileSystem",
              filePath: "foo\\content\\bar\\yaml.yaml",
              name: "yaml"
            },
            title: "Foo YAML"
          }
        });
        done();
      }
    };
    iterate(iterator);
  });
});