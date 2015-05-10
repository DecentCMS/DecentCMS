// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.

var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');

var http = {
  '@noCallThru': true,
  request: function request(options, callback) {
    var response = stubs.http.response = {
      handlers: {},
      chunks: [],
      on: function on(event, eventCallback) {
        response.handlers[event] = eventCallback;
      },
      emit: function emit(event, payload) {
        response.handlers[event](payload);
      },
      setEncoding: function setEncoding() {},
      send: function send(data) {
        response.emit('data', data);
        response.emit('end');
      }
    };

    var request = {
      options: options,
      handlers: {end: http.onRequestEnd},
      chunks: [],
      on: function on(event, eventCallback) {
        request.handlers[event] = eventCallback;
      },
      emit: function emit(event, payload) {
        request.handlers[event](payload);
      },
      write: function write(chunk) {
        request.chunks.push(chunk);
      },
      end: function end() {
        callback(response);
        request.emit('end');
      },
      getRequestBody: function () {
        return request.chunks.join('');
      }
    };
    return http._request = request;
  }
};

function fakeCouch(items) {
  var designDoc = {};
  http.onRequestEnd = function onFakeCouchRequestEnd() {
    var results;
    if (http._request.options.path === '/test-db/_design/filtered_index') {
      // This is a request for the design document where views are defined.
      if (http._request.options.method === 'GET') {
        results = designDoc;
      }
      else {
        designDoc = JSON.parse(http._request.getRequestBody());
        results = {ok: true};
      }
    }
    else if (http._request.options.method === 'GET') {
      // This is a request for a view.
      var url = require('url').parse(http._request.options.path);
      var path = url.pathname;
      var viewName = path.substr(path.lastIndexOf('/') + 1);
      var view = designDoc.views[viewName];
      var filteredRows = [];
      function emit(id, item) {
        filteredRows.push({id: id, doc: item});
      }
      eval('var map = ' + view.map);
      var params = require('querystring').parse(url.query);
      Object.getOwnPropertyNames(items)
        .forEach(function mapItem(id) {
          var item = items[id];
          item._id = id;
          map(item);
        });
      var skip = params.skip || 0;
      var limit = params.limit || null;
      var pageItems = (skip >= filteredRows.length)
        ? []
        : limit
          ? filteredRows.slice(skip, skip + limit)
          : filteredRows.slice(skip);
      results = {rows: pageItems};
    }
    else {
      // This is a request for specific items.
      var requestBody = JSON.parse(http._request.getRequestBody());
      var keys = requestBody.keys;
      if (keys) {
        // This is a request for specific keys
        results = {rows: []};
        keys.forEach(function resolveKey(key) {
          results.rows.push(
            items.hasOwnProperty(key)
              ? {id: key, doc: items[key]}
              : {id: key, error: 'not_found'});
        });
      }
    }
    http.response.send(JSON.stringify(results));
  };
}

var stubs = {
  http: http,
  https: http
};

var shape = {
  temp: function temp(shape) {
    return shape.temp = shape.temp || {};
  }
};
var log = {
  error: function logError(msg, obj) {
    throw {msg: msg, obj: obj};
  }
};
var shell = {
  settings: {
    'couch-db': {
      connections: {
        'default': {}
      }
    },
    'couch-db-content-store': {
      connection: 'default',
      database: 'test-db'
    }
  }
};

var StubbedCouch = proxyquire('../lib/couch', stubs);

var services = {
  shape: shape,
  log: log,
  shell: shell,
  '../lib/couch': StubbedCouch,
  'couch-db': {
    getCouch: function(config) {
      return new StubbedCouch({}, config);
    }
  }
};

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

describe('CouchDB Content Store', function() {
  var CouchContentStore = require('../services/couch-db-content-store');

  it('can load JSON content items', function (done) {
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
        'bar/baz': [itemCallback, itemCallback]
      }
    };

    fakeCouch({
      '/': {meta: {type: 'page'}, title: 'Home'},
      'bar/baz': {meta: {type: 'other-type'}, title: 'Foo'}
    });
    CouchContentStore.loadItems(context, function () {
      expect(itemIdsRead)
        .to.deep.equal(['/', 'bar/baz', 'bar/baz']);
      expect(items['/'].title).to.equal('Home');
      expect(items['/'].meta.type).to.equal('page');
      expect(items['/'].temp.storage).to.equal('CouchDB');
      expect(items['/'].temp.database).to.equal('test-db');
      expect(items['bar/baz'].title).to.equal('Foo');
      expect(items['bar/baz'].meta.type).to.equal('other-type');
      expect(items['bar/baz'].temp.storage).to.equal('CouchDB');
      expect(items['bar/baz'].temp.database).to.equal('test-db');
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

    fakeCouch({});
    CouchContentStore.loadItems(context, function (err) {
      expect(err).to.not.be.ok;
      expect(context.itemsToFetch.doesntExist).to.be.ok;
      expect(context.items.doesntExist).to.not.be.ok;
      done();
    });
  });
});

describe('CouchDB Content Enumerator', function() {
  var CouchContentEnumerator = proxyquire('../services/couch-db-content-enumerator', stubs);

  it('can asynchronously enumerate all items in the database', function(done) {
    fakeCouch({
      '/': {meta: {type: 'page'}, title: 'Home'},
      'bar/baz': {meta: {type: 'other-type'}, title: 'Foo'}
    });
    var items = {};
    var iterate = CouchContentEnumerator.getItemEnumerator({scope: scope});
    var iterator = function(err, item) {
      if (err) throw err;
      if (item) {
        items[item.id] = item;
        iterate(iterator);
      }
      else {
        expect(items).to.deep.equal({
          "/": {
            "id": "/",
            "meta": {
              "type": "page"
            },
            "temp": {
              "storage": "CouchDB",
              "database": "test-db"
            },
            "title": "Home"
          },
          "bar/baz": {
            "id": "bar/baz",
            "meta": {
              "type": "other-type"
            },
            "temp": {
              "storage": "CouchDB",
              "database": "test-db"
            },
            "title": "Foo"
          }
        });
        done();
      }
    };
    iterate(iterator);
  });

  it('can filter ids', function(done) {
    fakeCouch({
      '/': {meta: {type: 'page'}, title: 'Home'},
      'bar/baz': {meta: {type: 'other-type'}, title: 'Foo'}
    });
    var items = {};
    var iterate = CouchContentEnumerator.getItemEnumerator({
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
            "id": "bar/baz",
            "meta": {
              "type": "other-type"
            },
            "temp": {
              "storage": "CouchDB",
              "database": "test-db"
            },
            "title": "Foo"
          }
        });
        done();
      }
    };
    iterate(iterator);
  });
});