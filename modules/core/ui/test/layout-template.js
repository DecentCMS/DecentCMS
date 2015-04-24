// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;
var RenderStream = require('../services/render-stream');

describe('Layout Template', function() {
  it('renders scripts, stylesheets, metas, body', function(done) {
    var scope = new EventEmitter();
    var renderer = new RenderStream(scope);
    var result = '';
    renderer.on('data', function(data) {
      result += data;
    });
    renderer.title = 'Foo';
    renderer.scripts = ['script.js'];
    renderer.stylesheets = ['style.css'];
    renderer.addMeta('generator', 'DecentCMS');
    scope.callService = function(service, method, options, next) {
      options.renderStream
        .write('[' + options.shape.name + ']')
        .finally(next);
    };
    var layout = {
      main: {name: 'main'}
    };
    var layoutView = require('../views/layout');

    layoutView(layout, renderer, function() {
      expect(result)
        .to.equal(
        '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
        '<title>Foo</title>' +
        '<meta name="generator" content="DecentCMS"/>' +
        '<link href="style.css" rel="stylesheet" type="text/css"/>' +
        '</head>' +
        '<body>[main]' +
        '<script src="script.js" type="text/javascript"></script>' +
        '</body></html>');
      done();
    });
  });
});
