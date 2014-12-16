// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

var TextPart = require('../services/text-part');
var TitlePart = require('../services/title-part');
var TextView = require('../views/text');
var TitleView = require('../views/title');

describe('Text Part Handler', function() {
  it('adds shapes for each text part', function(done) {
    var item = {
      title: 'Foo',
      body: {
        src: 'body.md',
        _data: 'Lorem ipsum'
      },
      summary: 'Lorem',
      disclaimer: {
        flavor: 'strawberry',
        text: 'Not my fault'
      },
      tags: ['foo', 'bar']
    };
    var context = {
      shape: {
        meta: {
          type: 'content'
        },
        temp: {
          item: item,
          displayType: 'summary',
          shapes: []
        }
      },
      renderStream: {
        contentManager: {
          getParts: function() {
            return ['body', 'summary', 'other', 'disclaimer'];
          }
        }
      }
    };

    TextPart.handleItem(context, function() {
      var newShapes = context.shape.temp.shapes;
      expect(newShapes[0])
        .to.deep.equal({
          meta: {type: 'text', name: 'body'},
          temp: {displayType: 'summary'},
          text: 'Lorem ipsum',
          flavor: 'md'
        });
      expect(newShapes[1])
        .to.deep.equal({
          meta: {type: 'text', name: 'summary'},
          temp: {displayType: 'summary'},
          text: 'Lorem',
          flavor: 'plain-text'
        });
      expect(newShapes[2])
        .to.deep.equal({
          meta: {type: 'text', name: 'disclaimer'},
          temp: {displayType: 'summary'},
          text: 'Not my fault',
          flavor: 'strawberry'
        });
      done();
    });
  });
});

describe('Title Part Handler', function() {
  it('adds a shape for the title part', function(done) {
    var item = {
      title: 'Foo'
    };
    var context = {
      shape: {
        meta: {
          type: 'content'
        },
        temp: {
          item: item,
          displayType: 'summary',
          shapes: []
        }
      }
    };

    TitlePart.handleItem(context, function() {
      var newShapes = context.shape.temp.shapes;
      expect(newShapes[0])
        .to.deep.equal({
          meta: {type: 'title'},
          temp: {displayType: 'summary'},
          text: 'Foo'
        });
      done();
    });
  });

  it('sets the title only if the display type is main', function(done) {
    var item = {
      title: 'Foo'
    };
    var context = {
      shape: {
        meta: {
          type: 'content'
        },
        temp: {
          item: item,
          displayType: 'summary',
          shapes: []
        }
      },
      renderStream: {}
    };

    TitlePart.handleItem(context, function() {
      expect(context.renderStream.title).to.not.be.ok;

      context.shape.temp.displayType = 'main';
      TitlePart.handleItem(context, function() {
        expect(context.renderStream.title).to.equal('Foo');
        done();
      });
    });
  });
});

describe('Text Part View', function() {
  it('renders plain text HTML-encoded, with br tags for carriage returns', function() {
    var text = 'Lorem\r\n<b>ipsum</b>.';
    var html = '';
    var renderer = {write: function(text) {
      html += text;
    }};

    TextView({text: text, flavor: 'plain-text'}, renderer);

    expect(html).to.equal('Lorem<br/>\r\n&lt;b&gt;ipsum&lt;/b&gt;.');
  });

  it('renders html as is', function() {
    var text = 'Lorem\r\n<b>ipsum</b>.';
    var html = '';
    var renderer = {write: function(text) {
      html += text;
    }};

    TextView({text: text, flavor: 'html'}, renderer);

    expect(html).to.equal(text);
  });

  it('renders custom flavors', function() {
    var flavorHandler = {
      matches: function(flavor) {
        return flavor === 'custom';
      },
      getHtml: function(text) {
        return text + text;
      }
    };
    var scope = {
      getServices: function() {
        return [flavorHandler];
      }
    };
    var html = '';
    var renderer = {write: function(text) {
      html += text;
    }};

    TextView({text: 'foo', flavor: 'custom'}, renderer, scope);

    expect(html).to.equal('foofoo');
  });
});

describe('Title Part View', function() {
  it('renders the encoded title in h1 tags', function() {
    var html = '';
    var renderer = {
      tag: function(tag, attributes, text) {
        html += '[' + tag + ':' + text + ']';
      }
    };

    TitleView({text: 'foo du fa fa'}, renderer);

    expect(html)
      .to.equal('[h1:foo du fa fa]');
  });
});