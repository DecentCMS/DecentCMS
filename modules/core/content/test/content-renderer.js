// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;
var stream = require('stream');
var async = require('async');

var ContentStorageManager = require('../services/content-storage-manager');
var ContentRenderer = require('../services/content-renderer');

describe('Content Renderer', function() {
  it('promises to render shapes by adding them to its list', function () {
    var request = {};
    var cm = new ContentRenderer(request);
    var shape1 = {};
    var shape2 = {};

    cm.promiseToRender({request: request, shape: shape1});
    cm.promiseToRender({request: request, shape: shape2});

    expect(request.shapes)
      .to.deep.equal([shape1, shape2]);
  });

  it('promises to render ids by adding promise shapes to its list', function () {
    var request = {
      require: function () {
        return new ContentStorageManager(request);
      }
    };
    var cm = new ContentRenderer(request);

    cm.promiseToRender({request: request, id: 'foo', displayType: 'main'});

    expect(request.shapes[0].meta.type)
      .to.equal('shape-item-promise');
    expect(request.shapes[0].temp.displayType)
      .to.equal('main');
    expect(request.shapes[0].id)
      .to.equal('foo');
  });

  it('executes a page lifecycle', function (done) {
    var response = new stream.PassThrough();
    var html = [];
    var servicesAndMethods = [];
    response.on('data', function (data) {
      html.push(data);
    });
    var request = new EventEmitter();
    request.require = function () {
      return new stream.PassThrough();
    };
    request.lifecycle = function () {
      var args = arguments;
      return function (context, callback) {
        async.each(args, function (argument, next) {
          if (typeof(argument) === 'string') {
            servicesAndMethods.push(argument);
            next();
          }
          else {
            argument(context, next);
          }
        }, function () {
          callback();
        });
      }
    };
    request.on(ContentRenderer.registerMetaEvent, function (payload) {
      payload.renderStream.write('meta');
    });
    request.on(ContentRenderer.registerStyleEvent, function (payload) {
      payload.renderStream.write('style');
    });
    request.on(ContentRenderer.registerScriptEvent, function (payload) {
      payload.renderStream.write('script');
    });
    var cm = new ContentRenderer(request);

    cm.render({
      scope: request,
      request: request,
      response: response
    }, function () {
      expect(html.join('|'))
        .to.equal('meta|style|script');
      expect(servicesAndMethods.join('|'))
        .to.equal('placement-strategy|placeShapes|shape-handler|handle|rendering-strategy|render');
      done();
    });
  });
});
