// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;
var stream = require('stream');
var async = require('async');

var ContentManager = require('../services/content-manager');
var ContentStorageManager = require('../services/content-storage-manager');
var ContentRenderer = require('../services/content-renderer');

describe('Content Manager', function() {
  it('can promise to get single ids', function() {
    var scope = {};
    var cm = new ContentStorageManager(scope);
    cm.promiseToGet('foo');
    expect(scope.itemsToFetch)
      .to.contain.key('foo');
    cm.promiseToGet('bar');
    expect(scope.itemsToFetch)
      .to.contain.key('foo')
      .and.to.contain.key('bar');
  });

  it('can promise to get arrays of ids', function() {
    var scope = {};
    var cm = new ContentStorageManager(scope);
    cm.promiseToGet(['foo', 'bar']);
    expect(scope.itemsToFetch)
      .to.contain.key('foo')
      .and.to.contain.key('bar');
    cm.promiseToGet(['bar', 'baz']);
    expect(scope.itemsToFetch)
      .to.contain.key('foo')
      .and.to.contain.key('bar')
      .and.to.contain.key('baz');
  });

  it('immediately calls back when an item is already available', function() {
    var scope = {items: {foo:{}}};
    var cm = new ContentStorageManager(scope);
    var fetchedItem = null;
    cm.promiseToGet('foo', function(err, item) {
      fetchedItem = item;
    });
    cm.fetchContent();

    expect(fetchedItem).to.be.ok;
  });

  it('calls into content stores to fetch items', function(done) {
    var got = [];
    var itemCallback = function(err, item) {
      got.push(item.data);
    };
    var cm = new ContentStorageManager({
      itemsToFetch: {
        foo: [itemCallback],
        bar: [itemCallback, itemCallback]
      },
      callService: function(service, method, payload, next) {
        var itemsToFetch = payload.itemsToFetch;
        for (var id in itemsToFetch) {
          var item = {id: id, data: 'fetched ' + id};
          payload.items[id] = item;
          for (var i = 0; i < itemsToFetch[id].length; i++) {
            itemsToFetch[id][i](null, item);
          }
          delete payload.itemsToFetch[id];
        }
        next();
      }
    });

    cm.fetchContent(
      {},
      function(err) {
        if (err) {
          got.push(err.message);
          return;
        }
        expect(got)
          .to.deep.equal([
            'fetched foo',
            'fetched bar',
            'fetched bar'
          ]);
        done();
    });
  });

  it('promises to render shapes by adding them to its list', function() {
    var request = {};
    var cm = new ContentRenderer(request);
    var shape1 = {};
    var shape2 = {};

    cm.promiseToRender({request: request, shape: shape1});
    cm.promiseToRender({request: request, shape: shape2});

    expect(request.shapes)
      .to.deep.equal([shape1, shape2]);
  });

  it('promises to render ids by adding promise shapes to its list', function() {
    var request = {
      require: function() {
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

  it('executes a page lifecycle', function(done) {
    var response = new stream.PassThrough();
    var html = [];
    var servicesAndMethods = [];
    response.on('data', function(data) {
      html.push(data);
    });
    var request = new EventEmitter();
    request.require = function () {
      return new stream.PassThrough();
    };
    request.lifecycle = function() {
      var args = arguments;
      return function(payload, callback) {
        async.each(args, function(argument, next) {
          if (typeof(argument) === 'string') {
            servicesAndMethods.push(argument);
            next();
          }
          else {
            argument(payload, next);
          }
        }, function() {
          callback();
        });
      }
    };
    request.on(ContentRenderer.registerMetaEvent, function(payload) {
      payload.renderStream.write('meta');
    });
    request.on(ContentRenderer.registerStyleEvent, function(payload) {
      payload.renderStream.write('style');
    });
    request.on(ContentRenderer.registerScriptEvent, function(payload) {
      payload.renderStream.write('script');
    });
    var cm = new ContentRenderer(request);

    cm.render({
      scope: request,
      request: request,
      response: response
    }, function() {
      expect(html.join('|'))
        .to.equal('meta|style|script');
      expect(servicesAndMethods.join('|'))
        .to.equal('placement-strategy|placeShapes|shape-handler|handle|rendering-strategy|render');
      done();
    });
  });

  it('can infer the type definition for a shape', function() {
    var cm = new ContentManager();
    var fooDefinition = {};
    cm.scope = {
      types: {
        foo: fooDefinition
      }
    };

    var typeDefinition = cm.getType({
      meta: {type: 'foo'}
    });

    expect(typeDefinition)
      .to.equal(fooDefinition);
  });

  it('can find the parts that are of a specific type', function() {
    var cm = new ContentManager();
    cm.scope = {
      types: {
        foo: {
          parts: {
            bar1: {type: 'part-bar'},
            bar2: {type: 'part-bar'},
            baz: {type: 'part-baz'}
          }
        }
      }
    };
    var foo = {meta: {type: 'foo'}};

    var barParts = cm.getParts(foo, 'part-bar');

    expect(barParts.indexOf('bar1')).to.not.equal(-1);
    expect(barParts.indexOf('bar2')).to.not.equal(-1);
    expect(barParts.indexOf('baz')).to.equal(-1);
  });
});