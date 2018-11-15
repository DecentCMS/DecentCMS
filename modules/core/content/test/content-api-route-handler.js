// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

describe('Content API Route Handler', function() {
  var ContentRouteHandler = require('../services/content-api-route-handler');

  var middleware = null;
  var context = {
    expressApp: {
      register: function(_, registration) {
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
    fetchContent: function(_, done) {
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

  var processedShapes = [
    {foo: 'fou', meta: {name: 'foo'}},
    {bar: 'barre', meta: {name: 'bar'}}
  ];
  var services = {
    shape: {
      copy: item => {
        var copy = Object.assign({}, item);
        delete copy.temp;
        return copy;
      }
    },
    "storage-manager": storageManager,
    "shape-handler": {
      handle: function(context, callback) {
        if (triggerServiceError) {
          callback('service oops');
          return;
        }
        context.shape.temp.shapes = processedShapes;
        callback();
      }
    },
    "part-loader": {
      load: function(context, callback) {
        callback();
      }
    }
  };
  var request = {
    require: service => services[service],
    callService: function(service, method, context, callback) {
      services[service][method](context, callback)
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
  ContentRouteHandler.register(request, context);
  var handlers = {};
  var app = {
    get: function(r, h) {
      handlers[r] = h;
    }
  };
  middleware(app);

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
      expect(responseBody).to.deep.equal({
        foo: processedShapes[0],
        bar: processedShapes[1]
      });
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
