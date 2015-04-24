// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;
var RenderStream = require('../services/render-stream');

describe('Render Stream', function() {
  var RenderStream = require('../services/render-stream');
  var scope = new EventEmitter();
  scope.debug = true;
  var renderer = new RenderStream(scope);
  var result = null;
  renderer.on('data', function(data) {
    result += data;
  });

  beforeEach(function reset() {
    result = '';
    renderer.scripts = [];
    renderer.stylesheets = [];
    renderer.meta = {};
    renderer.title = '';
    renderer.tags = [];
    renderer._pendingCount = false;
  });

  it('writes text without encoding it', function() {
    var html = 'foo<b>du fa fa</b>';
    renderer.write(html);

    expect(result).to.equal(html);
  });

  it('writes encoded text', function() {
    var html = 'foo<b>du fa fa</b>';
    renderer.writeEncoded(html);

    expect(result).to.equal('foo&lt;b&gt;du fa fa&lt;/b&gt;');
  });

  it('writes lines without encoding them', function() {
    var html = 'foo<b>du fa fa</b>';
    renderer.writeLine(html);

    expect(result).to.equal(html + '\r\n');
  });

  it('writes encoded lines', function() {
    var html = 'foo<b>du fa fa</b>';
    scope.debug = true;
    renderer.writeEncodedLine(html);
    delete scope.debug;

    expect(result).to.equal('foo&lt;b&gt;du fa fa&lt;/b&gt;\r\n');
  });

  it('writes line breaks', function() {
    renderer.br();

    expect(result).to.equal('<br/>\r\n');
  });

  it('writes empty tags as self-closing', function() {
    renderer.tag('img', {alt: 'the image', src: 'foo.gif'});

    expect(result)
      .to.equal('<img alt="the image" src="foo.gif"/>');
  });

  it('writes non-empty tags', function() {
    renderer.tag('span', {title: 'the span'}, 'foo');

    expect(result)
      .to.equal('<span title="the span">foo</span>');
  });

  it('encodes attributes', function() {
    renderer.renderAttributes({title: 'the <b>span</b>'});

    expect(result)
      .to.equal(' title="the &lt;b&gt;span&lt;/b&gt;"');
  });

  it('closes tags in order', function() {
    renderer
      .startTag('div')
      .startTag('ul')
      .startTag('li')
      .endTag()
      .endTag()
      .endTag();

    expect(result)
      .to.equal('<div><ul><li></li></ul></div>');
  });

  it('can end all tags', function() {
    renderer
      .startTag('div')
      .startTag('ul')
      .startTag('li')
      .endAllTags();

    expect(result)
      .to.equal('<div><ul><li></li></ul></div>');
  });

  it('can render a shape', function(done) {
    var shape = {};
    scope.callService = function(service, method, options, next) {
      process.nextTick(function() {
        expect(service).to.equal('rendering-strategy');
        expect(method).to.equal('render');
        expect(options.shape).to.equal(shape);
        next();
      });
    };
    renderer
      .shape(shape)
      .finally(done);
  });

  it('can render a shape inside a tag', function(done) {
    var shape = {};
    scope.callService = function(service, method, options, next) {
      process.nextTick(function() {
        options.renderStream
          .write('[shape]')
          .finally(next);
      });
    };
    renderer
      .shape({shape: shape, tag: 'span', attributes: {id: 'shape-id'}})
      .shape({shape: shape, tag: 'div'})
      .finally(function() {
        expect(result).to.equal('<span id="shape-id">[shape]</span><div>[shape]</div>');
        done();
      });
  });

  it("renders nothing if the shape doesn't exist", function(done) {
    var shape = null;
    scope.callService = function(service, method, options, next) {
      process.nextTick(function() {
        options.renderStream
          .write('[shape]')
          .finally(next);
      });
    };
    renderer
      .shape()
      .shape({shape: shape, tag: 'span', attributes: {id: 'shape-id'}})
      .finally(function() {
        expect(result).to.equal('');
        done();
      });
  });

  it('writes html doc type by default', function() {
    renderer.doctype();

    expect(result)
      .to.equal('<!DOCTYPE html>');
  });

  it('writes doc type', function() {
    renderer.doctype('xhtml');

    expect(result)
      .to.equal('<!DOCTYPE xhtml>');
  });

  it('adds local style sheets under /css', function() {
    renderer.stylesheets = [];
    renderer
      .addStyleSheet('foo')
      .addStyleSheet('bar');

    expect(renderer.stylesheets)
      .to.deep.equal([
        '/css/foo.css',
        '/css/bar.css'
      ]);
  });

  it('adds external style sheets', function() {
    renderer.stylesheets = [];
    renderer
      .addExternalStyleSheet('foo')
      .addExternalStyleSheet('bar');

    expect(renderer.stylesheets)
      .to.deep.equal([
        'foo',
        'bar'
      ]);
  });

  it('deals with duplicate style sheets', function() {
    renderer.stylesheets = [];
    renderer
      .addStyleSheet('foo')
      .addStyleSheet('bar')
      .addStyleSheet('foo')
      .addExternalStyleSheet('foo')
      .addExternalStyleSheet('bar')
      .addExternalStyleSheet('/css/bar.css')
      .addExternalStyleSheet('foo');

    expect(renderer.stylesheets)
      .to.deep.equal([
        '/css/foo.css',
        '/css/bar.css',
        'foo',
        'bar'
      ]);
  });

  it('renders stylesheets', function() {
    renderer.stylesheets = [];
    renderer
      .addStyleSheet('foo')
      .addStyleSheet('bar')
      .renderStyleSheets();

    expect(result)
      .to.equal(
      '<link href="/css/foo.css" rel="stylesheet" type="text/css"/>\r\n' +
      '<link href="/css/bar.css" rel="stylesheet" type="text/css"/>\r\n');
  });

  it('adds local scripts under /js', function() {
    renderer.scripts = [];
    renderer
      .addScript('foo')
      .addScript('bar');

    expect(renderer.scripts)
      .to.deep.equal([
        '/js/foo.js',
        '/js/bar.js'
      ]);
  });

  it('adds external scripts', function() {
    renderer.scripts = [];
    renderer
      .addExternalScript('foo')
      .addExternalScript('bar');

    expect(renderer.scripts)
      .to.deep.equal([
        'foo',
        'bar'
      ]);
  });

  it('deals with duplicate scripts', function() {
    renderer.scripts = [];
    renderer
      .addScript('foo')
      .addScript('bar')
      .addScript('foo')
      .addExternalScript('foo')
      .addExternalScript('bar')
      .addExternalScript('/js/bar.js')
      .addExternalScript('foo');

    expect(renderer.scripts)
      .to.deep.equal([
        '/js/foo.js',
        '/js/bar.js',
        'foo',
        'bar'
      ]);
  });

  it('renders scripts', function() {
    renderer.scripts = [];
    renderer
      .addScript('foo')
      .addScript('bar')
      .renderScripts();

    expect(result)
      .to.equal(
      '<script src="/js/foo.js" type="text/javascript"></script>\r\n' +
      '<script src="/js/bar.js" type="text/javascript"></script>\r\n');
  });

  it('renders meta tags', function() {
    renderer
      .addMeta('generator', 'DecentCMS')
      .addMeta('foo', 'bar', {baz:'baaaa', blah: 'lorem'})
      .addMeta(null, null, {foo: 'fou'})
      .addMeta(null, 'bar', {foo: 'fou'})
      .renderMeta();

    expect(result)
      .to.equal(
      '<meta name="generator" content="DecentCMS"/>\r\n' +
      '<meta baz="baaaa" blah="lorem" name="foo" content="bar"/>\r\n' +
      '<meta foo="fou"/>\r\n' +
      '<meta foo="fou" content="bar"/>\r\n');
  });
});
