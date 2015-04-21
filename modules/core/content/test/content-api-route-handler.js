// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');

describe('Content API Route Handler', function() {
  var ContentRouteHandler = require('../services/content-api-route-handler');
  it('renders the JSON representation of content items', function(done) {
    var fetchedId = null;
    var item = null;
    var responseText = null;
    var mimeType = null;

    var middleware = null;
    var context = {
      expressApp: {
        register: function(priority, registration) {
          middleware = registration;
        }
      }
    };
    var storageManager = {
      promiseToGet: function(id) {
        fetchedId = id;
      },
      fetchContent: function(context, done) {
        item = {foo: 'bar', temp: 'should not be here'};
        done();
      },
      getAvailableItem: function(id) {
        item.id = id;
        return item;
      }
    };
    ContentRouteHandler.register({}, context);
    var handler = null;
    var route = null;
    var app = {
      get: function(r, h) {
        route = r;
        handler = h;
      }
    };
    middleware(app);

    var request = {
      require: function() {
        return storageManager;
      },
      path: '/api/foo%3abar/baz'
    };
    var response = {
      send: function(text) {
        responseText = text;
      },
      type: function(type) {
        mimeType = type;
      }
    };
    handler(request, response, function() {
      expect(fetchedId).to.equal('foo:bar/baz');
      expect(item.id).to.equal('foo:bar/baz');
      expect(item.foo).to.equal('bar');
      expect(item.temp).to.not.be.ok;
      expect(mimeType).to.equal('json');
      expect(responseText).to.deep.equal({foo: 'bar', id: 'foo:bar/baz'});
      done();
    });
  });
});
