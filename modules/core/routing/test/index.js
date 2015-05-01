// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');

describe('Content Route Handler', function() {
  var ContentRouteHandler = require('../services/content-route-handler');
  it('promises to render content items with the main display type', function(done) {
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
    ContentRouteHandler.register({}, context);
    var handler = null;
    var route = null;
    var app = {
      get: function(r, h) {
        route = r;
        handler = h;
      }
    };
    middleware(app);

    expect(route).to.equal('*');

    handler({
      require: function() {
        return contentRenderer;
      },
      contentManager: contentRenderer,
      path: '/foo/bar/baz'
    }, {
      contentType: function() {}
    }, function() {
      expect(shape.id).to.equal('foo/bar/baz');
      expect(shape.displayType).to.equal('main');
      done();
    });
  });

  it("can build an item's URL from its id", function() {
    expect(ContentRouteHandler.getUrl('foo/bar/baz'))
      .to.equal('/foo/bar/baz');
    expect(ContentRouteHandler.getUrl('foo:bar/baz'))
      .to.not.be.ok;
  });
});

describe('Static Route Handler', function() {
  it('registers all existing static paths in all modules as routes', function() {
    var middleware = null;
    var scope = {
      require: function() {return {verbose: function() {}}},
      modules: ['moduleA', 'moduleB'],
      moduleManifests: {
        moduleA: {physicalPath: path.join('path', 'to', 'a')},
        moduleB: {physicalPath: path.join('path', 'to', 'b')}
      },
      rootPath: path.join('sites', 'default'),
      settings: {'static-route-handler': {
        staticFolders: ['img', 'js', 'css'],
        mediaFolder: 'media'
      }}
    };
    var context = {
      expressApp: {
        register: function(priority, registration) {
          middleware = registration;
        }
      },
      express: {
        static: function(path) {return path;}
      }
    };
    var files = [
      path.join('path', 'to', 'a', 'img'),
      path.join('path', 'to', 'a', 'css'),
      path.join('path', 'to', 'b', 'css'),
      path.join('path', 'to', 'b', 'js'),
      path.join('sites', 'default', 'media')
    ];
    var StaticRouteHandler = proxyquire('../services/static-route-handler', {
      fs: {
        existsSync: function(path) {return files.indexOf(path) !== -1;}
      }
    });

    StaticRouteHandler.register(scope, context);
    var routes = [];
    var app = {
      use: function(url, path) {
        routes.push({url: url, path: path});
      }
    };
    middleware(app);

    expect(routes)
      .to.deep.equal([
        {url: '/img', path: files[0]},
        {url: '/css', path: files[1]},
        {url: '/js', path: files[3]},
        {url: '/css', path: files[2]},
        {url: '/media', path: files[4]},
        {url: '/favicon.ico', path: path.resolve('favicon.ico')}
      ]);
  });

  it('registers a favicon route for the shell if the file exists', function() {
    var middleware = null;
    var scope = {
      require: function() {return {verbose: function() {}}},
      modules: [],
      moduleManifests: {},
      rootPath: path.join('sites', 'default'),
      settings: {'static-route-handler': {
        staticFolders: []
      }}
    };
    var context = {
      expressApp: {
        register: function(priority, registration) {
          middleware = registration;
        }
      },
      express: {
        static: function(path) {return path;}
      }
    };
    var files = [
      path.resolve('sites', 'default', 'favicon.ico')
    ];
    var StaticRouteHandler = proxyquire('../services/static-route-handler', {
      fs: {
        existsSync: function(path) {return files.indexOf(path) !== -1;}
      }
    });

    StaticRouteHandler.register(scope, context);
    var routes = [];
    var app = {
      use: function(url, path) {
        routes.push({url: url, path: path});
      }
    };
    middleware(app);

    expect(routes)
      .to.deep.equal([
        {url: '/favicon.ico', path: path.resolve('./sites/default/favicon.ico')}
      ]);
  });
});

describe('Prevent trailing slash route handler', function() {
  it ('redirects only requests with trailing slashes', function(done) {
    var PreventTrailingSlashRouteHandler =
          require('../services/prevent-trailing-slash-route-handler');
    var middleware = null;
    var context = {
      expressApp: {
        register: function (priority, registration) {
          middleware = registration;
        }
      }
    };
    PreventTrailingSlashRouteHandler.register({}, context);
    var handler = null;
    var route = null;
    var app = {
      get: function (r, h) {
        route = r;
        handler = h;
      }
    };
    middleware(app);

    expect(route).to.equal('*');

    var redirect = {};
    var response = {
      redirect: function (code, url) {
        redirect.code = code;
        redirect.url = url;
      }
    };
    handler({path: '/foo/bar/baz/'}, response, function () {
    });
    expect(redirect.code).to.equal(301);
    expect(redirect.url).to.equal('/foo/bar/baz');

    redirect = {};
    handler({path: '/foo/bar/baz'}, response, function () {
      expect(redirect.code).to.not.be.ok;
      expect(redirect.url).to.not.be.ok;

      redirect = {};
      handler({path: '/'}, response, function() {
        expect(redirect.code).to.not.be.ok;
        expect(redirect.url).to.not.be.ok;

        done();
      });
    });
  });
});