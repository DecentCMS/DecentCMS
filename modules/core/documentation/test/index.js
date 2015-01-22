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

  it("won't map paths outside of /doc", function() {
    var mapper = new DocumentationPathMapper({});
    var paths = mapper.mapIdToPath('not-doc', '/path/to/foo');

    expect(paths).to.not.be.ok;
  });

  it('maps /doc to /doc/index paths', function() {
    var mapper = new DocumentationPathMapper(scope);
    var paths = mapper.mapIdToPath('doc', '');

    expect(paths).to.deep.equal([
      path.resolve('doc/index.json'),
      path.resolve('doc/index.yaml'),
      path.resolve('doc/index.yaml.md')
    ])
  });

  it('maps /doc/module to /path/to/module/doc/index paths', function() {
    var mapper = new DocumentationPathMapper(scope);
    var paths = mapper.mapIdToPath('doc', 'module');

    expect(paths).to.deep.equal([
      path.resolve('path/to/module/doc/index.json'),
      path.resolve('path/to/module/doc/index.yaml'),
      path.resolve('path/to/module/doc/index.yaml.md')
    ])
  });

  it('maps /doc/topic to /doc/topic paths', function() {
    var mapper = new DocumentationPathMapper(scope);
    var paths = mapper.mapIdToPath('doc', 'topic');

    expect(paths).to.deep.equal([
      path.resolve('doc/topic.json'),
      path.resolve('doc/topic.yaml'),
      path.resolve('doc/topic.yaml.md')
    ])
  });

  it('maps /doc/module/topic to /path/to/module/doc/topic paths', function() {
    var mapper = new DocumentationPathMapper(scope);
    var paths = mapper.mapIdToPath('doc', 'module/topic');

    expect(paths).to.deep.equal([
      path.resolve('path/to/module/doc/topic.json'),
      path.resolve('path/to/module/doc/topic.yaml'),
      path.resolve('path/to/module/doc/topic.yaml.md')
    ])
  });
});

describe('Documentation Route Handler', function() {
  it('promises to render topics with the main display type', function(done) {
    var DocumentationRouteHandler = require('../services/documentation-route-handler');
    var middleware = null;
    var payload = {
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
    DocumentationRouteHandler.register({}, payload);
    var handler = null;
    var route = null;
    var app = {
      get: function(r, h) {
        route = r;
        handler = h;
      }
    };
    middleware(app);

    expect(route).to.equal('/doc(/*)?');

    handler({
      require: function() {
        return contentRenderer;
      },
      contentManager: contentRenderer,
      path: '/doc/module/topic'
    }, null, function() {
      expect(shape.id).to.equal('doc:module/topic');
      expect(shape.displayType).to.equal('main');
      done();
    });
  });
});
