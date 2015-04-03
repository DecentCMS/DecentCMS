// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

// TODO: be consistent about putting the item on temp, not meta.

var TextPart = require('../services/text-part');
var TitlePart = require('../services/title-part');
var UrlPart = require('../services/url-part');
var ShapePart = require('../services/shape-part');
var TextView = require('../views/text');
var TitleView = require('../views/title');
var UrlView = require('../views/url');

describe('Text Part Handler', function() {
  it('adds shapes for each text part', function(done) {
    var item = {
      title: 'Foo',
      body: {
        src: 'body.md',
        text: 'Lorem ipsum'
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
      scope: {
        require: function require(service) {
          if (service === 'content-manager') {
            return {
              getParts: function() {
                return ['body', 'summary', 'other', 'disclaimer'];
              }
            };
          }
        }
      }
    };

    TextPart.handle(context, function() {
      var newShapes = context.shape.temp.shapes;
      expect(newShapes[0])
        .to.deep.equal({
          meta: {type: 'text', name: 'body', alternates: ['text-body'], item: item},
          temp: {displayType: 'summary'},
          text: 'Lorem ipsum',
          flavor: 'md'
        });
      expect(newShapes[1])
        .to.deep.equal({
          meta: {type: 'text', name: 'summary', alternates: ['text-summary'], item: item},
          temp: {displayType: 'summary'},
          text: 'Lorem',
          flavor: 'plain-text'
        });
      expect(newShapes[2])
        .to.deep.equal({
          meta: {type: 'text', name: 'disclaimer', alternates: ['text-disclaimer'], item: item},
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

    TitlePart.handle(context, function() {
      var newShapes = context.shape.temp.shapes;
      expect(newShapes[0])
        .to.deep.equal({
          meta: {type: 'title', item: item},
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
      scope: {layout: {}},
      renderStream: {}
    };

    TitlePart.handle(context, function() {
      expect(context.renderStream.title).to.not.be.ok;
      expect(context.scope.title).to.not.be.ok;
      expect(context.scope.layout.title).to.not.be.ok;

      context.shape.temp.displayType = 'main';
      TitlePart.handle(context, function() {
        expect(context.renderStream.title).to.equal('Foo');
        expect(context.scope.title).to.equal('Foo');
        expect(context.scope.layout.title).to.equal('Foo');
        done();
      });
    });
  });
});

describe('URL Part Handler', function() {
  it('adds shapes for each url part', function(done) {
    var item = {
      title: 'Foo',
      permalink: {
        url: 'http://weblogs.asp.net/bleroy',
        text: 'Tales From The Evil Empire'
      },
      body: {
        src: 'body.md',
        text: 'Lorem ipsum'
      },
      summary: 'Lorem',
      disclaimer: {
        flavor: 'strawberry',
        text: 'Not my fault'
      },
      license: {
        url: 'http://opensource.org/licenses/MIT'
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
      scope: {
        require: function require(service) {
          if (service === 'content-manager') {
            return {
              getParts: function() {
                return ['permalink', 'license'];
              }
            };
          }
        }
      }
    };

    UrlPart.handle(context, function() {
      var newShapes = context.shape.temp.shapes;
      expect(newShapes[0])
        .to.deep.equal({
          meta: {type: 'url', name: 'permalink', alternates: ['url-permalink'], item: item},
          temp: {displayType: 'summary'},
          text: 'Tales From The Evil Empire',
          url: 'http://weblogs.asp.net/bleroy'
        });
      expect(newShapes[1])
        .to.deep.equal({
          meta: {type: 'url', name: 'license', alternates: ['url-license'], item: item},
          temp: {displayType: 'summary'},
          text: 'http://opensource.org/licenses/MIT',
          url: 'http://opensource.org/licenses/MIT'
        });
      done();
    });
  });
});

describe('Shape Part Handler', function() {
  it('adds shapes for each part that has a shape on itself or on the type', function(done) {
    var item = {
      title: 'Foo',
      'inline-shape1': {
        meta: {type: 'inline', shape: 'from-inline'},
        foo: 'fou 1',
        bar: 'barre 1'
      },
      'inline-shape2': {
        meta: {type: 'inline', shape: 'from-inline'},
        foo: 'fou 2',
        bar: 'barre 2'
      },
      body: {
        src: 'body.md',
        text: 'Lorem ipsum'
      },
      'shape-from-type': {
        baz: 'base'
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
      scope: {
        require: function require(service) {
          switch (service) {
            case 'content-manager':
              return {
                getParts: function() {
                  return ['inline-shape1', 'body', 'shape-from-type'];
                },
                getType: function() {
                  return {
                    parts: {
                      'inline-shape1': {shape: 'should-be-ignored'},
                      body: {type: 'text'},
                      'shape-from-type': {shape: 'from-type'}
                    }
                  };
                }
              };
            case 'shape':
              return {
                meta: function(item) {return item.meta = item.meta || {};},
                temp: function(item) {return item.temp = item.temp || {};}
              };
          }
        }
      }
    };

    ShapePart.handle(context, function() {
      var newShapes = context.shape.temp.shapes;
      expect(newShapes[0])
        .to.deep.equal({
          meta: {type: 'from-inline', name: 'inline-shape1', alternates: ['from-inline-inline-shape1'], item: item},
          temp: {displayType: 'summary'},
          foo: 'fou 1',
          bar: 'barre 1'
        });
      expect(newShapes[1])
        .to.deep.equal({
          meta: {type: 'from-inline', name: 'inline-shape2', alternates: ['from-inline-inline-shape2'], item: item},
          temp: {displayType: 'summary'},
          foo: 'fou 2',
          bar: 'barre 2'
        });
      expect(newShapes[2])
        .to.deep.equal({
          meta: {type: 'from-type', name: 'shape-from-type', alternates: ['from-type-shape-from-type'], item: item},
          temp: {displayType: 'summary'},
          baz: 'base'
        });
      done();
    });
  });
});

describe('Text Part View', function() {
  var text = 'Lorem\r\n<b>ipsum</b>.';
  var html = '';
  var renderer = {
    write: function write(text) {
      html += text;
      return renderer;
    },
    finally: function final(callback) {
      callback();
    }
  };

  beforeEach(function() {
    html = '';
  });

  it('renders plain text HTML-encoded, with br tags for carriage returns', function(done) {
    TextView({text: text, flavor: 'plain-text'}, renderer, function() {
      expect(html).to.equal('Lorem<br/>\r\n&lt;b&gt;ipsum&lt;/b&gt;.');
      done();
    });
  });

  it('renders html as is', function(done) {
    TextView({text: text, flavor: 'html'}, renderer, function() {
      expect(html).to.equal(text);
      done();
    });
  });

  it('renders custom flavors', function(done) {
    var flavorHandler = {
      matches: function(flavor) {
        return flavor === 'custom';
      },
      getHtml: function(text) {
        return text + text;
      }
    };
    renderer.scope = {
      getServices: function() {
        return [flavorHandler];
      }
    };

    TextView({text: 'foo', flavor: 'custom'}, renderer, function() {
      expect(html).to.equal('foofoo');
      done();
    });
  });
});

describe('Title Part View', function() {
  it('renders the encoded title in h1 tags', function(done) {
    var html = '';
    var renderer = {
      tag: function(tag, attributes, text) {
        html += '[' + tag + ':' + text + ']';
        return renderer;
      },
      finally: function final(callback) {
        callback();
      }
    };

    TitleView({text: 'foo du fa fa'}, renderer, function() {
      expect(html)
        .to.equal('[h1:foo du fa fa]');
      done();
    });
  });
});

describe('URL Part View', function() {
  var text = 'Lorem ipsum';
  var url = 'http://decentcms.org';
  var html = '';
  var renderer = {
    tag: function tag(tagName, attributes, content) {
      html += '<' + tagName;
      Object.getOwnPropertyNames(attributes).forEach(function(attributeName) {
        html += ' ' + attributeName + '="' + attributes[attributeName] + '"';
      });
      html += '>' + content + '</' + tagName + '>';
      return renderer;
    },
    finally: function final(callback) {
      callback();
    }
  };

  beforeEach(function() {
    html = '';
  });

  it('renders a link', function(done) {
    UrlView({text: text, url: url}, renderer, function() {
      expect(html).to.equal('<a href="http://decentcms.org">Lorem ipsum</a>');
      done();
    });
  });
});
