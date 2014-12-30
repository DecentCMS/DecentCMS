// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var WidgetRouteHandler = require('../services/widget-route-handler');

describe('Widget Route Handler', function() {
  var widgets = [];
  var shell = {};
  var scope = {
    callService: function(service, method, context, next) {
      if (service === 'layer-store' && method === 'loadLayers') {
        context.layers = {
          default: {
            rule: 'true',
            widgets: [
              {id: 1},
              {id: 2}
            ]
          },
          custom: {
            rule: 'foo(bar) && baz',
            widgets: [
              {id: 3}
            ]
          },
          nope: {
            rule: 'foo(bart) || !baz',
            widgets: [
              {id: 4}
            ]
          }
        };
      }
      else if (service === 'layer-rule-context-builder' && method === 'buildContext') {
        context.foo = function(param) {return param === 42;};
        context.bar = 42;
        context.bart = 43;
        context.baz = true;
      }
      next();
    },
    require: function(service) {
      switch(service) {
        case 'renderer':
          return {
            promiseToRender: function(widget) {
              widgets.push(widget.id);
            }
          };
        case 'shell':
          return shell;
      }
    }
  };
  var widgetRouteHandler = new WidgetRouteHandler(scope);

  beforeEach(function() {
    widgets = [];
  });

  it('selects layers and renders widgets according to the context', function(done) {
    widgetRouteHandler.handle({}, function() {
      expect(widgets).to.deep.equal([1, 2, 3]);
      done();
    });
  });
});