// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var EventEmitter = require('events').EventEmitter;
var Stream = require('stream');
var shapeHelper = require('../services/shape');
var RenderStream = require('../services/render-stream');

describe('Code View Engine', function() {
  it('can render html using JavaScript functions.', function() {
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
    var template = codeViewEngine.load('shape');
    template({}, renderer);

    expect(html.join(''))
      .to.equal('[shape]');
  });
});

describe('Default Theme Selector', function() {
  it('selects the theme from shell settings', function() {
    var scope = {
      require: function() {return {theme: 'foo'};}
    };
    var DefaultThemeSelector = require('../services/default-theme-selector');
    var themeSelector = new DefaultThemeSelector(scope);
    var isThemeActive = themeSelector.isThemeActive({name: 'foo'});

    expect(isThemeActive).to.be.true;
  });
});

describe('File Placement Strategy', function() {
  // Set-up some mocked services
  var scope = new EventEmitter();
  scope.require = function(service) {
    switch(service) {
      case 'shape': return shapeHelper;
      case 'file-resolution': return {
        all: function() {
          return [
            'module1/placement.json',
            'module2/placement.json',
            'module2/placement.js'
          ];
        }
      }
    }
  };
  // And some placement using all the supported features
  var customPlacement = function(scope, rootShape, shapes) {
    for (var i = 0; i < shapes.length; i++) {
      if (shapeHelper.meta(shapes[i]).type === 'custom') {
        shapeHelper.place(rootShape, 'custom-zone', shapes[i], 'before');
        shapes.splice(i--, 1);
      }
    }
  };
  customPlacement['@noCallThru'] = true;
  var stubs = {
    'module1/placement.json': {
      matches: [
        {
          type: 'widget',
          path: 'sidebar', order: 'after'
        },
        {
          id: '^/foo/.*', type: '^(page|post)$', displayType: 'summary',
          path: 'content/header'
        },
        {
          type: 'page', displayType: 'main',
          path: 'content', order: 'before'
        }
      ],
      'tag-cloud-widget': {path: 'footer'},
      shape1: {path: 'zone1', order: '2.1'},
      shape2: {path: 'zone1', order: '2.0'},
      shape3: {path: 'zone2', order: '1'},
      '@noCallThru': true
    },
    'module2/placement.json': {
      shape3: {path: 'zone1', order: '1'},
      '@noCallThru': true
    },
    'module2/placement.js': customPlacement
  };

  it('places shapes according to placement.json file contents and placement.js', function() {
    var FilePlacementStrategy =
          proxyquire('../services/file-placement-strategy.js', stubs);
    FilePlacementStrategy.init(scope);
    var layout = {};
    var homePage, pageBaz, pageFooBar, post, htmlWidget1, htmlWidget2, tagCloudWidget, shape11, shape12, shape2, shape3, custom1, custom2;
    var shapes = [
      homePage =       {meta: {type: 'page'}, temp: {displayType: 'main'}, id: '/'},
      pageBaz =        {meta: {type: 'page'}, temp: {displayType: 'main'}, id: '/baz'},
      pageFooBar =     {meta: {type: 'page'}, temp: {displayType: 'summary'}, id: '/foo/bar'},
      post =           {meta: {type: 'post'}, temp: {displayType: 'summary'}, id: '/foo/post'},
      htmlWidget1 =    {meta: {type: 'html-widget'}, id: ':widget:html1'},
      htmlWidget2 =    {meta: {type: 'html-widget'}, id: ':widget:html2'},
      tagCloudWidget = {meta: {type: 'tag-cloud-widget'}, id: ':widget:tag-cloud'},
      shape11 =        {meta: {type: 'shape1'}, id: ':shape1:1'},
      shape12 =        {meta: {type: 'shape1'}, id: ':shape1:2'},
      shape2 =         {meta: {type: 'shape2'}, id: ':shape2:1'},
      shape3 =         {meta: {type: 'shape3'}, id: ':shape3:1'},
      custom1 =        {meta: {type: 'custom'}, id: ':custom:1'},
      custom2 =        {meta: {type: 'custom'}, id: ':custom:2'},
                       {meta: {type: 'wont-get-placed'}, id: ':wont-get-placed:'}
    ];
    scope.emit('decent.core.shape.placement', {
      shape: layout,
      shapes: shapes
    });

    // Check parents were set
    expect(layout.content.temp.parent).to.equal(layout);
    expect(layout.content.header.temp.parent).to.equal(layout.content);
    expect(layout['custom-zone'].temp.parent).to.equal(layout);
    expect(layout.sidebar.temp.parent).to.equal(layout);
    expect(layout.zone1.temp.parent).to.equal(layout);
    expect(layout.zone2.temp.parent).to.equal(layout);
    expect(homePage.temp.parent).to.equal(layout.content);
    expect(pageBaz.temp.parent).to.equal(layout.content);
    expect(pageFooBar.temp.parent).to.equal(layout.content.header);
    expect(post.temp.parent).to.equal(layout.content.header);
    expect(htmlWidget1.temp.parent).to.equal(layout.sidebar);
    expect(htmlWidget2.temp.parent).to.equal(layout.sidebar);
    expect(tagCloudWidget.temp.parent).to.equal(layout.sidebar);
    expect(shape11.temp.parent).to.equal(layout.zone1);
    expect(shape12.temp.parent).to.equal(layout.zone1);
    expect(shape2.temp.parent).to.equal(layout.zone1);
    expect(shape3.temp.parent).to.equal(layout.zone2);
    expect(custom1.temp.parent).to.equal(layout['custom-zone']);
    expect(custom2.temp.parent).to.equal(layout['custom-zone']);

    // Check all shapes were placed in the right zones, and in the right order
    expect(layout.content.temp.items).to.deep.equal([pageBaz, homePage]);
    expect(layout.content.header.temp.items).to.deep.equal([pageFooBar, post]);
    expect(layout['custom-zone'].temp.items).to.deep.equal([custom2, custom1]);
    expect(layout.sidebar.temp.items).to.deep.equal([htmlWidget1, htmlWidget2, tagCloudWidget]);
    expect(layout.zone1.temp.items).to.deep.equal([shape2, shape11, shape12]);
    expect(layout.zone2.temp.items).to.deep.equal([shape3]);
  });
});

describe('Render Stream', function() {
  var RenderStream = require('../services/render-stream');
  var scope = new EventEmitter();
  var renderer = new RenderStream(scope);
  var result = null;
  renderer.on('data', function(data) {
    result += data;
  });

  it('writes text without encoding it', function() {
    result = '';
    var html = 'foo<b>du fa fa</b>';
    renderer.write(html);

    expect(result).to.equal(html);
  });

  it('writes encoded text', function() {
    result = '';
    var html = 'foo<b>du fa fa</b>';
    renderer.writeEncoded(html);

    expect(result).to.equal('foo&lt;b&gt;du fa fa&lt;/b&gt;');
  });

  it('writes lines without encoding them', function() {
    result = '';
    var html = 'foo<b>du fa fa</b>';
    renderer.writeLine(html);

    expect(result).to.equal(html + '\r\n');
  });

  it('writes encoded lines', function() {
    result = '';
    var html = 'foo<b>du fa fa</b>';
    renderer.writeEncodedLine(html);

    expect(result).to.equal('foo&lt;b&gt;du fa fa&lt;/b&gt;\r\n');
  });

  it('writes line breaks', function() {
    result = '';
    renderer.br();

    expect(result).to.equal('<br/>\r\n');
  });

  it('writes empty tags as self-closing', function() {
    result = '';
    renderer.tag('img', {alt: 'the image', src: 'foo.gif'});

    expect(result)
      .to.equal('<img alt="the image" src="foo.gif"/>');
  });

  it('writes non-empty tags', function() {
    result = '';
    renderer.tag('span', {title: 'the span'}, 'foo');

    expect(result)
      .to.equal('<span title="the span">foo</span>');
  });

  it('encodes attributes', function() {
    result = '';
    renderer.renderAttributes({title: 'the <b>span</b>'});

    expect(result)
      .to.equal(' title="the &lt;b&gt;span&lt;/b&gt;"');
  });

  it('closes tags in order', function() {
    result = '';
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
    result = '';
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
    scope.once('decent.core.shape.render', function(payload) {
      expect(payload.shape).to.equal(shape);
      expect(payload.renderStream).to.equal(renderer);
      done();
    });
    renderer.shape(shape);
  });

  it('can render a shape inside a tag', function() {
    result = '';
    var shape = {};
    scope.once('decent.core.shape.render', function() {
      renderer.write('[shape]');
    });
    renderer.shape(shape, 'span', {id: 'shape-id'});

    expect(result).to.equal('<span id="shape-id">[shape]</span>');
  });

  it("renders nothing if the shape doesn't exist", function() {
    result = '';
    var shape = null;
    scope.once('decent.core.shape.render', function() {
      renderer.write('[shape]');
    });
    renderer.shape(shape, 'span', {id: 'shape-id'});

    expect(result).to.equal('');
  });

  it('writes html doc type by default', function() {
    result = '';
    renderer.doctype();

    expect(result)
      .to.equal('<!DOCTYPE html>');
  });

  it('writes doc type', function() {
    result = '';
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
    result = '';
    renderer.stylesheets = [];
    renderer
      .addStyleSheet('foo')
      .addStyleSheet('bar')
      .renderStyleSheets();

    expect(result)
      .to.equal(
      '  <link href="/css/foo.css" rel="stylesheet" type="text/css"/>\r\n' +
      '  <link href="/css/bar.css" rel="stylesheet" type="text/css"/>\r\n');
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
    result = '';
    renderer.scripts = [];
    renderer
      .addScript('foo')
      .addScript('bar')
      .renderScripts();

    expect(result)
      .to.equal(
      '  <script src="/js/foo.js" type="text/javascript"></script>\r\n' +
      '  <script src="/js/bar.js" type="text/javascript"></script>\r\n');
  });

  it('renders meta tags', function() {
    result = '';
    renderer
      .addMeta('generator', 'DecentCMS')
      .addMeta('foo', 'bar', {baz:'baaaa', blah: 'lorem'})
      .renderMeta();

    expect(result)
      .to.equal(
      '  <meta name="generator" content="DecentCMS"/>\r\n' +
      '  <meta baz="baaaa" blah="lorem" name="foo" content="bar"/>\r\n');
  });
});

describe('Shape', function() {
  it('can get and create meta', function() {
    var shape = {};
    var meta = shapeHelper.meta(shape);
    meta.foo = 42;

    expect(shape.meta.foo)
      .to.equal(42);
    expect(shapeHelper.meta(shape).foo)
      .to.equal(42);
  });

  it('can get and create temp', function() {
    var shape = {};
    var temp = shapeHelper.temp(shape);
    temp.foo = 42;

    expect(shape.temp.foo)
      .to.equal(42);
    expect(shapeHelper.temp(shape).foo)
      .to.equal(42);
  });

  it('can parse order strings', function() {
    var orderString = "1.42.after.1";
    var parsed = shapeHelper.parseOrder(orderString);

    expect(parsed)
      .to.deep.equal([1, 42, 'after', 1]);
  });

  it('parses null or empty strings into an empty array', function() {
    expect(shapeHelper.parseOrder(null))
      .to.deep.equal([]);
    expect(shapeHelper.parseOrder(''))
      .to.deep.equal([]);
  });

  it('inserts a shape in order', function() {
    var shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2]}, id: 3},
      {meta: {order: [3]}, id: 4}
    ];

    var shape = {id: 5};
    shapeHelper.insert(shapes, shape, '1.1.3');
    expect(shapes.indexOf(shape)).to.equal(1);
    expect(shape.meta.order).to.deep.equal([1, 1, 3]);
  });

  it('inserts a shape with the same order as another after it.', function() {
    var shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2]}, id: 3},
      {meta: {order: [3]}, id: 4}
    ];


    var shape = {id: 5};
    shapeHelper.insert(shapes, shape, '1.2');
    expect(shapes.indexOf(shape)).to.equal(2);
  });

  it('inserts shapes with no order at the end', function() {
    var shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2]}, id: 3},
      {meta: {order: [3]}, id: 4}
    ];

    var shape = {id: 5};
    shapeHelper.insert(shapes, shape);
    expect(shapes.indexOf(shape)).to.equal(4);
  });

  it('inserts shapes with "before" before', function() {
    var shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2, 1]}, id: 3},
      {meta: {order: [2, 2]}, id: 4},
      {meta: {order: [3]}, id: 5}
    ];

    var shape6 = {id: 6};
    shapeHelper.insert(shapes, shape6, '2.before');
    expect(shapes.indexOf(shape6)).to.equal(2);

    var shape7 = {id: 7};
    shapeHelper.insert(shapes, shape7, '2.before');
    expect(shapes.indexOf(shape7)).to.equal(2);
    expect(shapes.indexOf(shape6)).to.equal(3);

    var shape8 = {id: 7};
    shapeHelper.insert(shapes, shape8, '2.0');
    expect(shapes.indexOf(shape8)).to.equal(4);
  });

  it('inserts shapes with "after" after', function() {
    var shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2, 1]}, id: 3},
      {meta: {order: [2, 2]}, id: 4},
      {meta: {order: [3]}, id: 5}
    ];

    var shape6 = {id: 6};
    shapeHelper.insert(shapes, shape6, '2.after');
    expect(shapes.indexOf(shape6)).to.equal(4);

    var shape7 = {id: 7};
    shapeHelper.insert(shapes, shape7, '2.after');
    expect(shapes.indexOf(shape7)).to.equal(5);
    expect(shapes.indexOf(shape6)).to.equal(4);

    var shape8 = {id: 8};
    shapeHelper.insert(shapes, shape8, '2.3');
    expect(shapes.indexOf(shape8)).to.equal(4);
    expect(shapes.indexOf(shape6)).to.equal(5);
    expect(shapes.indexOf(shape7)).to.equal(6);
  });

  it('places shapes into deep trees', function() {
    var layout = {};
    var shape1 = {id: 1};
    shapeHelper.place(layout, 'content/foo/bar', shape1, '1');

    expect(layout.content.foo.bar.temp.items)
      .to.deep.equal([shape1]);

    var shape2 = {id: 2};
    var shape3 = {id: 3};
    shapeHelper.place(layout, 'content/foo/baz', shape2, '1');
    shapeHelper.place(layout, 'content/foo/baz', shape3, 'before');

    expect(layout.content.foo.bar.temp.items)
      .to.deep.equal([shape1]);
    expect(layout.content.foo.baz.temp.items)
      .to.deep.equal([shape3, shape2]);
  });
});

describe('Shape Item Promise Handler', function() {
  it('changes the promise shape into a content shape and runs a new rendering life cycle for the item', function(done) {
    var promiseShape = {
      meta: {type: 'shape-item-promise'},
      id: '/foo'
    };
    var item = {id: '/foo'};
    var options = {
      shape: promiseShape,
      renderStream: {
        contentManager: {
          getAvailableItem: function() {
            return item;
          }
        }
      }
    };
    var scope = new EventEmitter();
    scope.once('decent.core.handle-item', function(payload) {
      expect(payload.shape.temp.item).to.equal(item);
      payload.shape.temp.shapes.push({title: 'Foo'});
      scope.once('decent.core.shape.placement', function(payload) {
        expect(payload.shape.temp.shapes).to.not.be.ok;
        expect(payload.shape.temp.item).to.equal(item);
        expect(payload.shapes[0].title).to.equal('Foo');
        done();
      });
    });
    var ShapeItemPromiseHandler = require('../services/shape-item-promise-handler');
    ShapeItemPromiseHandler.on['decent.core.handle-item'](scope, options);
  });
});

describe('Template Rendering Strategy', function() {
  var buildScope = function() {
    var scope = new EventEmitter();
    scope.require = function(service) {
      switch(service) {
        case 'file-resolution': return fileResolver;
        case 'shape': return shapeHelper;
      }
    };
    scope.getServices = function(service) {
      if (service === 'view-engine') return [viewEngine1, viewEngine2];
    };
    return scope;
  };
  var viewEngine1 = {
    load: function(templatePath) {
      return function(shape, renderer, scope) {
        renderer.write('[ve1:' + shape.meta.type + ':' + templatePath + ']');
      };
    },
    extension: 've1'
  };
  var viewEngine2 = {
    load: function(templatePath) {
      return function(shape, renderer, scope) {
        renderer.write('[ve2:' + shape.meta.type + ':' + templatePath + ']');
      };
    },
    extension: 've2'
  };
  var fileResolver = {
    resolve: function(folder, file) {
      if (file.source === 'zone\\.(ve1|ve2)') return 'path/to/zone.ve1';
      return 'template.ve2';
    }
  };
  var TemplateRenderingStrategy =
        require('../services/template-rendering-strategy');

  it('selects a view engine based on the template it finds', function() {
    var scope = buildScope();
    TemplateRenderingStrategy.init(scope);
    var html = [];
    var renderer = new require('stream').PassThrough();
    renderer.on('data', function(chunk) {
      html.push(chunk.toString());
    });
    scope.emit('decent.core.shape.render', {
      shape: {meta: {type: 'shape1'}},
      renderStream: renderer
    });

    expect(html.join(''))
      .to.equal('[ve2:shape1:template.ve2]')
  });

  it('renders an untyped shape as a zone', function() {
    var scope = buildScope();
    TemplateRenderingStrategy.init(scope);
    var html = [];
    var renderer = new require('stream').PassThrough();
    renderer.on('data', function(chunk) {
      html.push(chunk.toString());
    });
    scope.emit('decent.core.shape.render', {
      shape: {},
      renderStream: renderer
    });

    expect(html.join(''))
      .to.equal('[ve1:zone:path/to/zone.ve1]')
  });

  it('renders a shape with temp.html directly without template', function() {
    var scope = buildScope();
    TemplateRenderingStrategy.init(scope);
    var html = [];
    var renderer = new require('stream').PassThrough();
    renderer.on('data', function(chunk) {
      html.push(chunk.toString());
    });
    scope.emit('decent.core.shape.render', {
      shape: {temp: {html: 'some html'}},
      renderStream: renderer
    });

    expect(html.join(''))
      .to.equal('some html')
  });
});

describe('Zone Handler', function() {
  it('lets sub-items and zones be handled', function() {
    var shape = {
      temp: {
        items: ['item1', 'item2'],
        zones: ['zone1', 'zone2']
      }
    };
    var scope = new EventEmitter();
    var handled = [];
    scope.on('decent.core.handle-item', function(payload) {
      handled.push(payload.shape);
    });
    var ZoneHandler = require('../services/zone-handler');

    ZoneHandler.on['decent.core.handle-item'](scope, {shape: shape});

    expect(handled).to.deep.equal(['item1', 'item2', 'zone1', 'zone2']);
  });
});

describe('Content Template', function() {
  it('renders header, main zone, and footer', function() {
    var RenderStream = require('../services/render-stream');
    var scope = new EventEmitter();
    var renderer = new RenderStream(scope);
    var result = '';
    renderer.on('data', function(data) {
      result += data;
    });
    scope.on('decent.core.shape.render', function(payload) {
      renderer.write('[' + payload.shape.name + ']');
    });
    var content = {
      header: {name: 'header'},
      main: {name: 'main'},
      footer: {name: 'footer'}
    };
    var contentView = require('../views/content');

    contentView(content, renderer);

    expect(result)
      .to.equal(
      '<article>' +
      '<header>[header]</header>' +
      '[main]' +
      '<footer>[footer]</footer>' +
      '</article>');
  });

  it("doesn't render header, main, or footer if they don't exist", function() {
    var RenderStream = require('../services/render-stream');
    var scope = new EventEmitter();
    var renderer = new RenderStream(scope);
    var result = '';
    renderer.on('data', function(data) {
      result += data;
    });
    scope.on('decent.core.shape.render', function(payload) {
      renderer.write('[' + payload.shape.name + ']');
    });
    var content = {};
    var contentView = require('../views/content');

    contentView(content, renderer);

    expect(result)
      .to.equal('<article></article>');
  });
});

describe('Layout Template', function() {
  it('renders scripts, stylesheets, metas, body', function() {
    var RenderStream = require('../services/render-stream');
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
    scope.on('decent.core.shape.render', function(payload) {
      renderer.write('[' + payload.shape.name + ']');
    });
    var layout = {
      main: {name: 'main'}
    };
    var layoutView = require('../views/layout');

    layoutView(layout, renderer);

    expect(result)
      .to.equal(
      '<!DOCTYPE html>\r\n' +
      '<html>\r\n' +
      '<head>\r\n' +
      '  <title>Foo</title>\r\n' +
      '  <meta name="generator" content="DecentCMS"/>\r\n' +
      '  <link href="style.css" rel="stylesheet" type="text/css"/>\r\n' +
      '</head>\r\n' +
      '<body>[main]\r\n' +
      '  <script src="script.js" type="text/javascript"></script>\r\n' +
      '</body></html>');
  });
});

describe('Zone Template', function() {
  var zoneTemplate = require('../views/zone');
  var scope = new EventEmitter();
  scope.require = function(service) {
    if (service === 'shape') return shapeHelper;
  };

  it('renders items under itself', function() {
    scope.on('decent.core.shape.render', function(payload) {
      var shape = payload.shape;
      var renderer = payload.renderStream;
      renderer.write('[' + shapeHelper.meta(shape).type + ']');
    });
    var zone = {
      meta: {type: 'zone'},
      temp: {
        items: [
          {meta: {type: 'shape1'}},
          {meta: {type: 'shape2'}},
          {meta: {type: 'shape3'}},
          {meta: {type: 'shape4'}}
        ]
      }
    };
    var html = [];
    var renderer = new RenderStream(scope);
    renderer.on('data', function(chunk) {
      html.push(chunk);
    });
    zoneTemplate(zone, renderer, scope);

    expect(html.join(''))
      .to.equal('[shape1][shape2][shape3][shape4]');
  });
});
