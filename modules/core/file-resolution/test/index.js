// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var Shell = require('decent-core-multi-tenancy').Shell;
var path = require('path');

describe('file-resolution', function() {
  it('resolves paths to existing files, and non-existing files to null', function() {
    var shell = new Shell();
    shell.modules = ['path/to/module1'];
    var resolvedPathToFile = path.resolve('path/to/module1/foo/bar.baz');
    var stubs = {
      fs: {
        existsSync: function (p) {
          return p === resolvedPathToFile;
        }
      }
    };
    var FileResolver = proxyquire('../lib/file-resolution', stubs);
    var fileResolver = new FileResolver(shell);
    var resolvedPath = fileResolver.resolve('foo/bar.baz');

    expect(resolvedPath)
      .to.equal(resolvedPathToFile);
    expect(fileResolver.resolve('does/not/exist'))
      .to.not.be.ok;
  });

  it('resolves paths to existing files in disabled modules to null', function() {
    var shell = new Shell();
    shell.modules = ['path/to/other-module', 'path/to/other-other-module'];
    var resolvedPathToFile = path.resolve('path/to/module1/foo/bar.baz');
    var stubs = {
      fs: {
        existsSync: function (p) {
          return p === resolvedPathToFile;
        }
      }
    };
    var FileResolver = proxyquire('../lib/file-resolution', stubs);
    var fileResolver = new FileResolver(shell);
    var resolvedPath = fileResolver.resolve('foo/bar.baz');

    expect(resolvedPath)
      .to.not.be.ok;
  });

  it('resolves paths to most dependent module', function() {
    var shell = new Shell();
    shell.modules = ['path/to/dependency', 'path/to/dependent'];
    var resolvedPathToFileInDependency = path.resolve('path/to/dependency/foo/bar.baz');
    var resolvedPathToFileInDependent = path.resolve('path/to/dependent/foo/bar.baz');
    var stubs = {
      fs: {
        existsSync: function (p) {
          return p === resolvedPathToFileInDependency || p === resolvedPathToFileInDependent;
        }
      }
    };
    var FileResolver = proxyquire('../lib/file-resolution', stubs);
    var fileResolver = new FileResolver(shell);
    var resolvedPath = fileResolver.resolve('foo/bar.baz');

    expect(resolvedPath)
      .to.equal(resolvedPathToFileInDependent);
  });

  it('can find paths in all modules in dependency order', function() {
    var shell = new Shell();
    shell.modules = ['path/to/dependency', 'path/to/dependent'];
    var resolvedPathToFileInDependency = path.resolve('path/to/dependency/foo/bar.baz');
    var resolvedPathToFileInDependent = path.resolve('path/to/dependent/foo/bar.baz');
    var stubs = {
      fs: {
        existsSync: function (p) {
          return p === resolvedPathToFileInDependency || p === resolvedPathToFileInDependent;
        }
      }
    };
    var FileResolver = proxyquire('../lib/file-resolution', stubs);
    var fileResolver = new FileResolver(shell);
    var resolvedPaths = fileResolver.all('foo/bar.baz');

    expect(resolvedPaths)
      .to.deep.equal([resolvedPathToFileInDependency, resolvedPathToFileInDependent]);
  });});
