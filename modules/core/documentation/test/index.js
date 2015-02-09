// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');
var DocumentationPathMapper = require('../services/documentation-path-mapper');
var ApiDocumentationPathMapper = require('../services/api-documentation-path-mapper');

describe('Documentation path mapper', function() {
  var scope = {
    require: function() {return {
      moduleManifests: {
        module: {
          physicalPath: 'path/to/module'
        }
      }
    };}
  };

  it("won't map paths outside of /docs", function() {
    var mapper = new DocumentationPathMapper({});
    var paths = mapper.mapIdToPath('not-doc', '/path/to/foo');

    expect(paths).to.not.be.ok;
  });

  it('maps /docs to /docs/index paths', function() {
    var mapper = new DocumentationPathMapper(scope);
    var paths = mapper.mapIdToPath('docs', '');

    expect(paths).to.deep.equal([
      path.resolve('docs/index.json'),
      path.resolve('docs/index.yaml'),
      path.resolve('docs/index.yaml.md')
    ])
  });

  it('maps /docs/module to /path/to/module/docs/index paths', function() {
    var mapper = new DocumentationPathMapper(scope);
    var paths = mapper.mapIdToPath('docs', 'module');

    expect(paths).to.deep.equal([
      path.resolve('path/to/module/docs/index.json'),
      path.resolve('path/to/module/docs/index.yaml'),
      path.resolve('path/to/module/docs/index.yaml.md')
    ])
  });

  it('maps /docs/topic to /docs/topic paths', function() {
    var mapper = new DocumentationPathMapper(scope);
    var paths = mapper.mapIdToPath('docs', 'topic');

    expect(paths).to.deep.equal([
      path.resolve('docs/topic.json'),
      path.resolve('docs/topic.yaml'),
      path.resolve('docs/topic.yaml.md')
    ])
  });

  it('maps /docs/module/topic to /path/to/module/docs/topic paths', function() {
    var mapper = new DocumentationPathMapper(scope);
    var paths = mapper.mapIdToPath('docs', 'module/topic');

    expect(paths).to.deep.equal([
      path.resolve('path/to/module/docs/topic.json'),
      path.resolve('path/to/module/docs/topic.yaml'),
      path.resolve('path/to/module/docs/topic.yaml.md')
    ])
  });
});

describe('Documentation Route Handler', function() {
  it('promises to render topics with the main display type', function(done) {
    var DocumentationRouteHandler = require('../services/documentation-route-handler');
    var middleware = null;
    var context = {
      expressApp: {
        register: function(priority, registration) {
          middleware = registration;
        }
      }
    };
    var shape = null;
    var contentRenderer = {
      promiseToRender: function(s) {
        shape = s;
      }
    };
    DocumentationRouteHandler.register({}, context);
    var handler = null;
    var route = null;
    var app = {
      get: function(r, h) {
        route = r;
        handler = h;
      }
    };
    middleware(app);

    expect(route).to.equal('/docs(/*)?');

    handler({
      require: function() {
        return contentRenderer;
      },
      contentManager: contentRenderer,
      path: '/docs/module/topic'
    }, null, function() {
      expect(shape.id).to.equal('docs:module/topic');
      expect(shape.displayType).to.equal('main');
      done();
    });
  });
});

describe('API Documentation path mapper', function() {
  var scope = {
    require: function() {return {
      moduleManifests: {
        module: {
          physicalPath: 'path/to/module'
        }
      }
    };}
  };

  it("won't map paths outside of /docs/api", function() {
    var mapper = new ApiDocumentationPathMapper({});
    var paths = mapper.mapIdToPath('not-apidocs', '/path/to/foo');

    expect(paths).to.not.be.ok;
  });

  it('maps /docs/api/module/service to path/to/module/lib/service.js and path/to/module/services/service.js paths', function() {
    var mapper = new ApiDocumentationPathMapper(scope);
    var paths = mapper.mapIdToPath('apidocs', 'module/service');

    expect(paths).to.deep.equal([
      path.resolve('path/to/module/services/service.js'),
      path.resolve('path/to/module/lib/service.js')
    ])
  });
});

describe('API Documentation Route Handler', function() {
  it('promises to render topics with the main display type', function(done) {
    var ApiDocumentationRouteHandler = require('../services/api-documentation-route-handler');
    var middleware = null;
    var context = {
      expressApp: {
        register: function(priority, registration) {
          middleware = registration;
        }
      }
    };
    var shape = null;
    var contentRenderer = {
      promiseToRender: function(s) {
        shape = s;
      }
    };
    ApiDocumentationRouteHandler.register({}, context);
    var handler = null;
    var route = null;
    var app = {
      get: function(r, h) {
        route = r;
        handler = h;
      }
    };
    middleware(app);

    expect(route).to.equal('/docs/api(/*)?');

    handler({
      require: function() {
        return contentRenderer;
      },
      contentManager: contentRenderer,
      path: '/docs/api/module/service'
    }, null, function() {
      expect(shape.id).to.equal('apidocs:module/service');
      expect(shape.displayType).to.equal('main');
      done();
    });
  });
});

describe('JsDoc File Parser', function() {
  var js = '// A js file\r\n\r\n' +
    '/**\r\n' +
    'A function\r\n' +
    '*/\r\n' +
    'function foo() {};\r\n';
  var parser = proxyquire('../services/jsdoc-content-file-parser', {
    'path/to/some-file-to-test.js': {
      scope: 'shell',
      feature: 'some feature',
      service: 'some service',
      '@noCallThru': true
    }
  });

  it('parses JavaScript files for JsDoc', function(done) {
    var context = {
      path: 'path/to/some-file-to-test.js',
      data: js,
      scope: {
        require: function() {
          return {
            transform: function(fileName) {
              return fileName.replace(/-/g, ' ');
            }
          }
        }
      }
    };
    parser.parse(context, function() {
      expect(context.item.meta.type).to.equal('api-documentation');
      expect(context.item.title).to.equal('path/to/some file to test.js');
      expect(context.item.scope).to.equal('shell');
      expect(context.item.feature).to.equal('some feature');
      expect(context.item.service).to.equal('some service');
      expect(context.item.body.flavor).to.equal('markdown');
      expect(context.item.body._data).to.equal('<a name=\"foo\"></a>\n## foo()\nA function\n\n');
      done();
    });
  });

  it("won't parse other types of files", function(done) {
    var context = {
      path: 'path/to/some-file-to-test.unknown',
      data: 'foo'
    };
    parser.parse(context, function() {
      expect(context.item).to.not.be.ok;
      done();
    });
  });
});