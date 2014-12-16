// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;
var RenderStream = require('../services/render-stream');

describe('Zone Template', function() {
  var zoneTemplate = require('../views/zone');
  var scope = new EventEmitter();
  var renderer = new RenderStream(scope);
  var result = '';
  renderer.on('data', function(data) {
    result += data;
  });
  scope.callService = function(service, method, options, next) {
    options.renderStream
      .write('[' + options.shape.name + ']')
      .finally(next);
  };

  beforeEach(function reset() {
    result = '';
    renderer._pendingCount = false;
  });

  it('renders items under itself', function(done) {
    var zone = {
      meta: {type: 'zone'},
      temp: {
        items: [
          {name: 'shape1'},
          {name: 'shape2'},
          {name: 'shape3'},
          {name: 'shape4'}
        ]
      }
    };
    zoneTemplate(zone, renderer, function() {
      expect(result)
        .to.equal('[shape1][shape2][shape3][shape4]');
      done();
    });
  });
});
