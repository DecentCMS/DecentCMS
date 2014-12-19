// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var RenderStream = require('../services/render-stream');
var dust = require('dustjs-linkedin');

describe('Dust View Engine', function() {
  var template;
  function readFile(path, done) {
    done(null, template);
  };
  readFile['@noCallThru'] = true;
  var dustViewEngine = proxyquire('../services/dust-view-engine', {
    fs: {
      readFile: readFile
    }
  });
  var scope = {
    callService: function(service, method, context, done) {
      process.nextTick(function() {
        var shape = context.shape;
        context.renderStream.write('[' + shape.meta.type + ':' + shape.title + ']');
        done();
      });
    }
  };
  var html;
  var renderer = new RenderStream(scope);
  renderer.on('data', function(chunk) {
    html.push(chunk);
  });

  beforeEach(function() {
    html = [];
    dust.cache = {};
  });

  it('can render html using Dust templates', function(done) {
    template = '<div>{greeting} <span>{who}</span>!</div>';
    dustViewEngine.load('path-to-template', function(renderTemplate) {
      renderTemplate({
        greeting: 'Hello',
        who: 'World'
      }, renderer, function() {
        expect(html.join(''))
          .to.equal('<div>Hello <span>World</span>!</div>');
        done();
      });
    });
  });

  it('can use Dust helpers', function(done) {
    template = 'My favorite shows are: {#shows}{name}{@sep}, {/sep}{/shows}.';
    dustViewEngine.load('path-to-template-with-helpers', function(renderTemplate) {
      renderTemplate({
        shows: [
          {name: 'Twin Peaks'},
          {name: 'Kingdom'},
          {name: 'Profit'}
        ]
      }, renderer, function() {
        expect(html.join(''))
          .to.equal('My favorite shows are: Twin Peaks, Kingdom, Profit.');
        done();
      });
    });
  });

  it('can render shapes', function(done) {
    template = 'Here\'s a shape: {@shape shape=theShape tag="div" class="shape-class"/}.';
    dustViewEngine.load('path-to-template-with-shape', function(renderTemplate) {
      renderTemplate({
        theShape: {
          meta: {type: 'sub-shape'},
          title: 'foo'
        }
      }, renderer, function() {
        expect(html.join(''))
          .to.equal('Here\'s a shape: <div class="shape-class">[sub-shape:foo]</div>.');
        done();
      });
    });
  });

  it('can register and render style sheets', function(done) {
    template = '{@style name="foo"/}{@style name="bar"/}{@style name="foo"/}'
      + 'Registered styles:{~n}{@styles/}.';
    dustViewEngine.load('path-to-template-registering-styles', function(renderTemplate) {
      renderTemplate({}, renderer, function() {
        expect(html.join(''))
          .to.equal('Registered styles:\n' +
          '  <link href=\"/css/foo.css\" rel=\"stylesheet\" type=\"text/css\"/>\r\n' +
          '  <link href=\"/css/bar.css\" rel=\"stylesheet\" type=\"text/css\"/>\r\n' +
          '.');
        done();
      });
    });
  });
});
