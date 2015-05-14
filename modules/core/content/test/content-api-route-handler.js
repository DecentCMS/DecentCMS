// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');

describe('Content API Route Handler', function() {
  var ContentRouteHandler = require('../services/content-api-route-handler');

  var middleware = null;
  var context = {
    expressApp: {
      register: function(priority, registration) {
        middleware = registration;
      }
    }
  };
  var fetchedId = null;
  var item = null;
  var responseBody = null;
  var mimeType = null;
  var status = 0;
  var triggerError = false;
  var triggerServiceError = false;

  var storageManager = {
    promiseToGet: function(id) {
      fetchedId = id;
    },
    fetchContent: function(context, done) {
      if (triggerError) {
        done('oops');
        return;
      }
      item = fetchedId === 'not-found'
        ? null : {foo: 'bar', temp: 'should not be here'};
      done();
    },
    getAvailableItem: function(id) {
      if (item) item.id = id;
      return item;
    }
  };
  ContentRouteHandler.register({}, context);
  var handlers = {};
  var app = {
    get: function(r, h) {
      handlers[r] = h;
    }
  };
  middleware(app);

  var processedShapes = [
    {foo: 'fou'},
    {bar: 'barre'}
  ];
  var request = {
    require: function() {
      return storageManager;
    },
    callService: function(service, method, context, callback) {
      if (triggerServiceError) {
        callback('service oops');
        return;
      }
      context.shape.temp.shapes = processedShapes;
      callback();
    }
  };
  var response = {
    send: function(text) {
      responseBody = text;
    },
    json: function(obj) {
      responseBody = obj;
    },
    type: function(type) {
      mimeType = type;
    },
    status: function(code) {
      status = code;
    }
  };

  beforeEach(function() {
    fetchedId = null;
    item = null;
    responseBody = null;
    mimeType = null;
    status = 0;
    request.routed = false;
    triggerError = false;
    triggerServiceError = false;
  });

  it("renders the JSON representation of a content item's source document", function(done) {
    request.path = '/api/src/foo%3abar/baz';
    var handler = handlers['/api/src(/*)?'];
    handler(request, response, function() {
      expect(fetchedId).to.equal('foo:bar/baz');
      expect(item.id).to.equal('foo:bar/baz');
      expect(item.foo).to.equal('bar');
      expect(item.temp).to.not.be.ok;
      expect(mimeType).to.equal('json');
      expect(responseBody).to.deep.equal({foo: 'bar', id: 'foo:bar/baz'});
      done();
    });
  });

  it("Give a 404 from /api/src for missing items", function(done) {
    request.path = '/api/src/not-found';
    var handler = handlers['/api/src(/*)?'];
    handler(request, response, function() {
      expect(status).to.equal(404);
      expect(responseBody).to.deep.equal({error: 'Not found'});
      done();
    });
  });

  it("renders 500 from api/src on errors", function(done) {
    triggerError = true;
    request.path = '/api/src/foo%3abar/baz';
    var handler = handlers['/api/src(/*)?'];
    handler(request, response, function() {
      expect(status).to.equal(500);
      expect(responseBody).to.deep.equal({error: 'oops'});
      done();
    });
  });

  it("renders the JSON representation of a content item's processed shapes", function(done) {
    request.path = '/api/shapes/foo%3abar/baz';
    var handler = handlers['/api/shapes(/*)?'];
    handler(request, response, function() {
      expect(fetchedId).to.equal('foo:bar/baz');
      expect(mimeType).to.equal('json');
      expect(responseBody).to.deep.equal(processedShapes);
      done();
    });
  });

  it("renders 500 from api/shapes on errors", function(done) {
    triggerError = true;
    request.path = '/api/shapes/foo%3abar/baz';
    var handler = handlers['/api/shapes(/*)?'];
    handler(request, response, function() {
      expect(status).to.equal(500);
      expect(responseBody).to.deep.equal({error: 'oops'});
      done();
    });
  });

  it("renders 500 from api/shapes on service errors", function(done) {
    triggerServiceError = true;
    request.path = '/api/shapes/foo%3abar/baz';
    var handler = handlers['/api/shapes(/*)?'];
    handler(request, response, function() {
      expect(status).to.equal(500);
      expect(responseBody).to.deep.equal({error: 'service oops'});
      done();
    });
  });
});
