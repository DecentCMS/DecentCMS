// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var path = require('path');

describe('Content Route Handler', function() {
  it('promises to render content items with the main display type', function(done) {
    var ContentRouteHandler = require('../services/content-route-handler');
    var middleware = null;
    var payload = {
      expressApp: {
        register: function(priority, registration) {
          middleware = registration;
        }
      }
    };
    ContentRouteHandler.register({}, payload);
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

    var shape = null;
    var contentManager = {
      promiseToRender: function(s) {
        shape = s;
      }
    };
    handler({
      contentManager: contentManager,
      path: '/foo/bar/baz'
    }, null, function() {
      expect(shape.id).to.equal('/foo/bar/baz');
      expect(shape.displayType).to.equal('main');
      done();
    });
  });
});

describe('Static Route Handler', function() {
  it('registers all existing static paths in all modules as routes', function() {
    var middleware = null;
    var scope = {
      modules: ['moduleA', 'moduleB'],
      moduleManifests: {
        moduleA: {physicalPath: path.join('path', 'to', 'a')},
        moduleB: {physicalPath: path.join('path', 'to', 'b')}
      },
      staticFolders: ['img', 'js', 'css']
    };
    var payload = {
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
      path.join('path', 'to', 'b', 'js')
    ];
    var StaticRouteHandler = proxyquire('../services/static-route-handler', {
      fs: {
        existsSync: function(path) {return files.indexOf(path) !== -1;}
      }
    });

    StaticRouteHandler.register(scope, payload);
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
        {url: '/css', path: files[2]}
      ]);
  });
});