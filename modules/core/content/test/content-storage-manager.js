// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

var ContentStorageManager = require('../services/content-storage-manager');

describe('Content Storage Manager', function() {
  it('can promise to get single ids', function () {
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

  it('can promise to get arrays of ids', function () {
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

  it('immediately calls back when an item is already available', function () {
    var scope = {items: {foo: {}}};
    var cm = new ContentStorageManager(scope);
    var fetchedItem = null;
    cm.promiseToGet('foo', function (err, item) {
      fetchedItem = item;
    });
    cm.fetchContent();

    expect(fetchedItem).to.be.ok;
  });

  it('immediately calls back when there are no items to fetch', function () {
    var scope = {items: {}};
    var cm = new ContentStorageManager(scope);
    var immediatelyCalled = false;
    cm.fetchContent({}, function() {
      immediatelyCalled = true;
    });
    expect(immediatelyCalled).to.be.ok;
  });

  it('calls into content stores to fetch items', function (done) {
    var got = [];
    var itemCallback = function (err, item) {
      got.push(item.data);
    };
    var cm = new ContentStorageManager({
      itemsToFetch: {
        foo: [itemCallback],
        bar: [itemCallback, itemCallback]
      },
      callService: function (service, method, context, next) {
        var itemsToFetch = context.itemsToFetch;
        for (var id in itemsToFetch) {
          var item = {id: id, data: 'fetched ' + id};
          context.items[id] = item;
          for (var i = 0; i < itemsToFetch[id].length; i++) {
            itemsToFetch[id][i](null, item);
          }
          delete context.itemsToFetch[id];
        }
        next();
      }
    });

    cm.fetchContent(
      {},
      function (err) {
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
});
