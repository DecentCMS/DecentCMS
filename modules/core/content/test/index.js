// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var ContentManager = require('../services/content-manager');

describe('Content Manager', function() {
  it('can promise to get single ids', function() {
    var cm = new ContentManager({});
    cm.promiseToGet('foo');
    expect(cm.itemsToFetch)
      .to.contain.key('foo');
    cm.promiseToGet('bar');
    expect(cm.itemsToFetch)
      .to.contain.key('foo')
      .and.to.contain.key('bar');
  });

  it('can promise to get arrays of ids', function() {
    var cm = new ContentManager({});
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
});