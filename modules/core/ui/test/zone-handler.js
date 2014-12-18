// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;

describe('Zone Handler', function() {
  it('lets sub-items and zones be handled', function(done) {
    var shape = {
      temp: {
        items: ['item1', 'item2'],
        zones: {zone1: 'zone1', zone2: 'zone2'}
      }
    };
    var request = new EventEmitter();
    var handled = [];
    request.callService = function(service, method, options, next) {
      handled.push(options.shape);
      next();
    };
    var ZoneHandler = require('../services/zone-handler');

    ZoneHandler.handle({scope: request, shape: shape}, function() {
      expect(handled).to.deep.equal(['item1', 'item2', 'zone1', 'zone2']);
      done();
    });
  });
});
