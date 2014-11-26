// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

var express = require('express');
var ExpressApp = require('../lib/express-app');
var ExpressRouteHandler = require('../services/express-route-handler');
var http = require('http');
var ServerResponse = http.ServerResponse;
var IncomingMessage = http.IncomingMessage;

describe('Express App', function() {
  it('registers middleware in priority order', function() {
    var app = [];
    var registration1 = function(theApp) {theApp.push('one')};
    var registration2 = function(theApp) {theApp.push('two')};
    var registration3 = function(theApp) {theApp.push('three')};

    var expressApp = new ExpressApp(app, {
      require: function(serviceName) {
        if (serviceName === 'localization') {
          return function(s) {return s;};
        }
      }
    });
    expressApp.register(2, registration1);
    expressApp.register(3, registration2);
    expressApp.register(1, registration3);
    expressApp.lock();

    expect(app).to.deep.equal(['three', 'one', 'two']);
  });

  it('can\'t register middleware after it\'s been locked', function() {
    var expressApp = new ExpressApp({}, {
      require: function(serviceName) {
        if (serviceName === 'localization') {
          return function(s) {return s;};
        }
      }
    });
    expressApp.lock();

    expect(expressApp.register).to.throw();
  });
});

describe('Express Route Handler', function() {
  it('registers and uses middleware in priority order', function(done) {
    var responses = [];
    var services = {
      middleware: [
        {register: function(scope, payload) {
          payload.expressApp.register(2, function(app) {
            app.get('/foo', function(request, response, next) {
              responses.push('first middleware');
              next();
            });
          });
        }},
        {register: function(scope, payload) {
          payload.expressApp.register(1, function(app) {
            app.get('/foo', function(request, response, next) {
              responses.push('second middleware');
              next();
            });
          });
        }}
      ]
    };
    var scope = {
      register: function(serviceName, service) {
        services[serviceName] = [service];
      },
      getServices: function(serviceName) {
        return services[serviceName];
      },
      require: function(serviceName) {
        return services[serviceName][0];
      }
    };
    scope.register('localization', function(s) {return s;});
    var expressRouteHandler = new ExpressRouteHandler(scope);
    var request = new IncomingMessage(80);
    request.url = '/foo';
    request.method = 'GET';
    var response = new ServerResponse(request);

    expressRouteHandler.handle({
        request: request,
        response: response
      }, function() {
        expect(scope.getServices('express')[0])
          .to.equal(express);
        expect(scope.getServices('express-app')[0])
          .to.equal(expressRouteHandler.expressApp);
        expect(responses)
          .to.deep.equal(['second middleware', 'first middleware']);
        done();
      });
  });
});