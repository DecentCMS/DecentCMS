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
  var DustViewEngine = proxyquire('../services/dust-view-engine', {
    fs: {
      readFile: readFile
    }
  });
  var scope = {
    callService: function callService(service, method, context, done) {
      process.nextTick(function() {
        var shape = context.shape;
        context.renderStream.write('[' + shape.meta.type + ':' + shape.title + ']');
        done();
      });
    },
    require: function require(service) {
      return function t(str) {
        switch(str) {
          case 'simple localized':
            return 'simplement localisé';
          case 'more complicated localized string with parameters: [foo] and [bar]...':
            return 'plus compliqué avec des paramètres: [foo] et [bar]...';
          default: return str;
        }
      }
    }
  };
  var dustViewEngine = new DustViewEngine(scope);
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

  it('can be localized', function(done) {
    template = 'Localized: {@t}simple localized{/t} or {@t}more complicated localized string with parameters: [foo] and [bar]...{/t}.'
    dustViewEngine.load('path-to-localizable-template', function(renderTemplate) {
      renderTemplate({
        foo: 'Fou',
        bar: 'Barre'
      }, renderer, function() {
        expect(html.join(''))
          .to.equal('Localized: simplement localisé or plus compliqué avec des paramètres: Fou et Barre....');
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
    template =
      '{@style name="foo"/}' +
      '{@style name="bar"/}' +
      '{@style name="foo"/}' +
      '{@style name="http://foo.com/css/style.css"/}' +
      '{@style name="https://bar.com/css/style.css"/}' +
      '{@style name="//baz.com/css/style.css"/}' +
      'Registered styles:{~n}{@styles/}.';
    dustViewEngine.load('path-to-template-registering-styles', function(renderTemplate) {
      renderTemplate({}, renderer, function() {
        expect(html.join(''))
          .to.equal('Registered styles:\n' +
          '  <link href="/css/foo.css" rel="stylesheet" type="text/css"/>\r\n' +
          '  <link href="/css/bar.css" rel="stylesheet" type="text/css"/>\r\n' +
          '  <link href="http://foo.com/css/style.css" rel="stylesheet" type="text/css"/>\r\n' +
          '  <link href="https://bar.com/css/style.css" rel="stylesheet" type="text/css"/>\r\n' +
          '  <link href="//baz.com/css/style.css" rel="stylesheet" type="text/css"/>\r\n' +
          '.');
        done();
      });
    });
  });

  it('can register and render scripts', function(done) {
    template =
      '{@script name="foo"/}' +
      '{@script name="bar"/}' +
      '{@script name="foo"/}' +
      '{@script name="http://foo.com/js/script.js"/}' +
      '{@script name="https://bar.com/js/script.js"/}' +
      '{@script name="//baz.com/js/script.js"/}' +
      'Registered scripts:{~n}{@scripts/}.';
    dustViewEngine.load('path-to-template-registering-scripts', function(renderTemplate) {
      renderTemplate({}, renderer, function() {
        expect(html.join(''))
          .to.equal('Registered scripts:\n' +
          '  <script src="/js/foo.js" type="text/javascript"></script>\r\n' +
          '  <script src="/js/bar.js" type="text/javascript"></script>\r\n' +
          '  <script src="http://foo.com/js/script.js" type="text/javascript"></script>\r\n' +
          '  <script src="https://bar.com/js/script.js" type="text/javascript"></script>\r\n' +
          '  <script src="//baz.com/js/script.js" type="text/javascript"></script>\r\n' +
          '.');
        done();
      });
    });
  });

  it('can register and render meta tags', function(done) {
    template =
      '{@meta name="foo" value="Fou"/}' +
      '{@meta name="bar" value="Barre" custom="yup" other="baz"/}' +
      '{@meta name="foo" value="Encore plus fou"/}' +
      'Registered metas:{~n}{@metas/}.';
    dustViewEngine.load('path-to-template-registering-metas', function(renderTemplate) {
      renderTemplate({}, renderer, function() {
        expect(html.join(''))
          .to.equal('Registered metas:\n' +
          '  <meta name="foo" content="Encore plus fou"/>\r\n' +
          '  <meta custom="yup" other="baz" name="bar" content="Barre"/>\r\n' +
          '.');
        done();
      });
    });
  });
});
