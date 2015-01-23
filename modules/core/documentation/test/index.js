// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var path = require('path');
var DocumentationPathMapper = require('../services/documentation-path-mapper');

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
