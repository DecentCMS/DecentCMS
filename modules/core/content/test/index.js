// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;
var stream = require('stream');
var ContentManager = require('../services/content-manager');

describe('Content Manager', function() {
  it('can promise to get single ids', function() {
    var cm = new ContentManager();
    cm.promiseToGet('foo');
    expect(cm.itemsToFetch)
      .to.contain.key('foo');
    cm.promiseToGet('bar');
    expect(cm.itemsToFetch)
      .to.contain.key('foo')
      .and.to.contain.key('bar');
  });

  it('can promise to get arrays of ids', function() {
    var cm = new ContentManager();
    cm.promiseToGet(['foo', 'bar']);
    expect(cm.itemsToFetch)
      .to.contain.key('foo')
      .and.to.contain.key('bar');
    cm.promiseToGet(['bar', 'baz']);
    expect(cm.itemsToFetch)
      .to.contain.key('foo')
      .and.to.contain.key('bar')
      .and.to.contain.key('baz');
  });

  it('immediately calls back when an item is already available', function() {
    var cm = new ContentManager();
    cm.items = {foo: {}};
    var fetchedItem = null;
    cm.promiseToGet('foo', function(err, item) {
      fetchedItem = item;
    });
    cm.fetchItems({});

    expect(fetchedItem).to.be.ok;
  });

  it('calls into content stores to fetch items', function(done) {
    var cm = new ContentManager({
      getServices: function() {
        return [{
          loadItems: function(scope, payload, next) {
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
        }];
      }
    });
    var got = [];
    var itemCallback = function(err, item) {
      got.push(item.data);
    };
    cm.itemsToFetch = {
      foo: [itemCallback],
      bar: [itemCallback, itemCallback]
    };
    cm.fetchItems(
      {request: new EventEmitter()},
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
    var cm = new ContentManager();
    var request = {};
    var shape1 = {};
    var shape2 = {};

    cm.promiseToRender({request: request, shape: shape1});
    cm.promiseToRender({request: request, shape: shape2});

    expect(request.shapes)
      .to.deep.equal([shape1, shape2]);
  });

  it('promises to render ids by adding promise shapes to its list', function() {
    var cm = new ContentManager();
    var request = {};

    cm.promiseToRender({request: request, id: 'foo', displayType: 'main'});

    expect(request.shapes[0].meta.type)
      .to.equal('shape-item-promise');
    expect(request.shapes[0].temp.displayType)
      .to.equal('main');
    expect(request.shapes[0].id)
      .to.equal('foo');
  });

  it('renders the page from a list of shapes', function() {
    var request = new EventEmitter();
    request.shapes = [
      {meta: {type: 'shape-type-1'}},
      {meta: {type: 'shape-type-2'}}
    ];
    request.require = function(serviceName) {
      return new stream.PassThrough();
    };
    var response = new stream.PassThrough();
    var html = [];
    response.on('data', function(data) {
      html.push(data);
    });
    request.on(ContentManager.placementEvent, function(payload) {
      payload.shape.one = payload.shapes[0];
      payload.shape.two = payload.shapes[1];
    });
    request.on(ContentManager.handleItemEvent, function(payload) {
      payload.shape.handled = true;
      payload.renderStream.write('handlers')
    });
    request.on(ContentManager.registerMetaEvent, function(payload) {
      payload.renderStream.write('meta');
    });
    request.on(ContentManager.registerStyleEvent, function(payload) {
      payload.renderStream.write('style');
    });
    request.on(ContentManager.registerScriptEvent, function(payload) {
      payload.renderStream.write('script');
    });
    request.on(ContentManager.renderShapeEvent, function(payload) {
      payload.shape.rendered = true;
      payload.renderStream.write('rendered');
    });
    var cm = new ContentManager({
      require: function(serviceName) {
        if (serviceName === 'localization') return function(s) {return s;};
      }
    });

    cm.buildRenderedPage({
      request: request,
      response: response
    });

    expect(html.join('|'))
      .to.equal('handlers|meta|style|script|rendered');
    expect(request.layout.one.meta.type)
      .to.equal('shape-type-1');
    expect(request.layout.two.meta.type)
      .to.equal('shape-type-2');
    expect(request.layout.handled).to.be.ok;
    expect(request.layout.rendered).to.be.ok;
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