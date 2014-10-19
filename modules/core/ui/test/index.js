// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var EventEmitter = require('events').EventEmitter;
var Shape = require('../lib/shape');

describe('Shape', function() {
  var shell = new EventEmitter();
  var shapeHelper = new Shape(shell);

  it('can get and create meta', function() {
    var shape = {};
    var meta = shapeHelper.meta(shape);
    meta.foo = 42;

    expect(shape.meta.foo)
      .to.equal(42);
    expect(shapeHelper.meta(shape).foo)
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

    expect(layout.content.foo.bar.items)
      .to.deep.equal([shape1]);

    var shape2 = {id: 2};
    var shape3 = {id: 3};
    shapeHelper.place(layout, 'content/foo/baz', shape2, '1');
    shapeHelper.place(layout, 'content/foo/baz', shape3, 'before');

    expect(layout.content.foo.bar.items)
      .to.deep.equal([shape1]);
    expect(layout.content.foo.baz.items)
      .to.deep.equal([shape3, shape2]);
  });
});

describe('File Placement Strategy', function() {
  // Set-up some mocked services
  var shell = new EventEmitter();
  var shapeHelper = new Shape(shell);
  shell.require = function(service) {
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
  var customPlacement = function(shell, rootShape, shapes) {
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
          proxyquire('../lib/file-placement-strategy.js', stubs);
    FilePlacementStrategy.init(shell);
    var layout = {};
    var homePage, pageBaz, pageFooBar, post, htmlWidget1, htmlWidget2, tagCloudWidget, shape11, shape12, shape2, shape3, custom1, custom2;
    var shapes = [
      homePage =       {meta: {type: 'page', displayType: 'main'}, id: '/'},
      pageBaz =        {meta: {type: 'page', displayType: 'main'}, id: '/baz'},
      pageFooBar =     {meta: {type: 'page', displayType: 'summary'}, id: '/foo/bar'},
      post =           {meta: {type: 'post', displayType: 'summary'}, id: '/foo/post'},
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
    shell.emit('decent.core.shape.placement', {
      shape: layout,
      shapes: shapes
    });

    // Check parents were set
    expect(layout.content.meta.parent).to.equal(layout);
    expect(layout.content.header.meta.parent).to.equal(layout.content);
    expect(layout['custom-zone'].meta.parent).to.equal(layout);
    expect(layout.sidebar.meta.parent).to.equal(layout);
    expect(layout.zone1.meta.parent).to.equal(layout);
    expect(layout.zone2.meta.parent).to.equal(layout);
    expect(homePage.meta.parent).to.equal(layout.content);
    expect(pageBaz.meta.parent).to.equal(layout.content);
    expect(pageFooBar.meta.parent).to.equal(layout.content.header);
    expect(post.meta.parent).to.equal(layout.content.header);
    expect(htmlWidget1.meta.parent).to.equal(layout.sidebar);
    expect(htmlWidget2.meta.parent).to.equal(layout.sidebar);
    expect(tagCloudWidget.meta.parent).to.equal(layout.sidebar);
    expect(shape11.meta.parent).to.equal(layout.zone1);
    expect(shape12.meta.parent).to.equal(layout.zone1);
    expect(shape2.meta.parent).to.equal(layout.zone1);
    expect(shape3.meta.parent).to.equal(layout.zone2);
    expect(custom1.meta.parent).to.equal(layout['custom-zone']);
    expect(custom2.meta.parent).to.equal(layout['custom-zone']);

    // Remove parents to make the deep equal test of layout easier
    delete layout.content.meta;
    delete layout.content.header.meta;
    delete layout['custom-zone'].meta;
    delete layout.sidebar.meta;
    delete layout.zone1.meta;
    delete layout.zone2.meta;
    delete homePage.meta.parent;
    delete pageBaz.meta.parent;
    delete pageFooBar.meta.parent;
    delete post.meta.parent;
    delete htmlWidget1.meta.parent;
    delete htmlWidget2.meta.parent;
    delete tagCloudWidget.meta.parent;
    delete shape11.meta.parent;
    delete shape12.meta.parent;
    delete shape2.meta.parent;
    delete shape3.meta.parent;
    delete custom1.meta.parent;
    delete custom2.meta.parent;

    // Check all shapes were placed in the right zones, and in the right order
    expect(layout).to.deep.equal({
      content: {
        items: [pageBaz, homePage],
        header: {
          items: [pageFooBar, post]
        }
      },
      'custom-zone': {
        items: [custom2, custom1]
      },
      sidebar: {
        items: [htmlWidget1, htmlWidget2, tagCloudWidget]
      },
      zone1: {
        items: [shape2, shape11, shape12]
      },
      zone2: {
        items: [shape3]
      }
    });
  });
});
