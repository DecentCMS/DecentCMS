// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var path = require('path');
var proxyquire = require('proxyquire');

describe('File Layer Store', function() {
  var FileLayerStore = proxyquire('../services/file-layer-store', {
    fs: {
      readFile: function readFile(filename, done) {
        if (filename === path.join('site', 'widget', 'index.json')) {
          done(null, '{"default": {}}');
        }
      }
    }
  });

  it('loads layers from site/widget/index.json', function(done) {
    var store = new FileLayerStore({
      rootPath: 'site'
    });
    var context = {};
    store.loadLayers(context, function() {
      expect(context.layers.default).to.be.ok;
      done();
    });
  });

  it('Adds to existing layers', function(done) {
    var store = new FileLayerStore({
      rootPath: 'site'
    });
    var context = {layers: {foo: {}}};
    store.loadLayers(context, function() {
      expect(context.layers.default).to.be.ok;
      expect(context.layers.foo).to.be.ok;
      done();
    });
  });
});