// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');

describe('Code View Engine', function() {
  it('can render html using JavaScript functions.', function(done) {
    var shapeTemplate = function(shape, renderer) {
      renderer.write('[shape]')
    };
    shapeTemplate['@noCallThru'] = true;
    var stubs = {'shape': shapeTemplate};
    var codeViewEngine = proxyquire('../services/code-view-engine', stubs);
    var html = [];
    var renderer = new require('stream').PassThrough();
    renderer.on('data', function(chunk) {
      html.push(chunk);
    });
    codeViewEngine.load('shape', function(template) {
      template({}, renderer);
      expect(html.join(''))
        .to.equal('[shape]');
      done();
    });
  });
});
