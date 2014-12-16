// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;
var RenderStream = require('../services/render-stream');

describe('Content Template', function() {
  var scope = new EventEmitter();
  var renderer = new RenderStream(scope);
  var result = '';
  renderer.on('data', function(data) {
    result += data;
  });
  scope.callService = function(service, method, options, next) {
    options.renderStream
      .write('[' + options.shape.meta.type + ']')
      .finally(next);
  };

  beforeEach(function reset() {
    result = '';
    renderer._pendingCount = false;
  });

  it('renders header, main zone, and footer', function(done) {
    var content = {
      header: {meta: {type: 'header'}},
      main: {meta: {type: 'main'}},
      footer: {meta: {type: 'footer'}}
    };
    var contentView = require('../views/content');

    contentView(content, renderer, function() {
      expect(result)
        .to.equal(
        '<article>' +
        '<header>[header]</header>' +
        '[main]' +
        '<footer>[footer]</footer>' +
        '</article>');
      done();
    });
  });

  it("doesn't render header, main, or footer if they don't exist", function(done) {
    var content = {};
    var contentView = require('../views/content');

    contentView(content, renderer, function() {
      expect(result)
        .to.equal('<article></article>');
      done()
    });
  });
});
