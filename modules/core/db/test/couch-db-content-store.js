// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
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
  http.onRequestEnd = function onFakeCouchRequestEnd() {
    var keys = JSON.parse(http._request.getRequestBody()).keys;
    var results = {
      rows: []
    };
    keys.forEach(function resolveKey(key) {
      results.rows.push(
        items.hasOwnProperty(key)
        ? {id: key, doc: items[key]}
        : {id: key, error: 'not_found'});
    });
    http.response.send(JSON.stringify(results));
  };
}

var stubs = {
  http: http,
  https: http
};

var CouchContentStore = proxyquire('../services/couch-db-content-store', stubs);

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
    'couch-db-content-store': {}
  }
};

var services = {
  shape: shape,
  log: log,
  shell: shell
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
        '/bar/baz': [itemCallback, itemCallback]
      }
    };

    fakeCouch({
      '/': {meta: {type: 'page'}, title: 'Home'},
      '/bar/baz': {meta: {type: 'other-type'}, title: 'Foo'}
    });
    CouchContentStore.loadItems(context, function () {
      expect(itemIdsRead)
        .to.deep.equal(['/', '/bar/baz', '/bar/baz']);
      expect(items['/'].title).to.equal('Home');
      expect(items['/'].meta.type).to.equal('page');
      expect(items['/bar/baz'].title).to.equal('Foo');
      expect(items['/bar/baz'].meta.type).to.equal('other-type');
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
