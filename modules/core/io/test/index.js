// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var Shell = function() {};
var path = require('path');

describe('file-resolution', function() {
  it('resolves paths to existing files, and non-existing files to null', function() {
    var shell = new Shell();
    shell.modules = ['path/to/module1'];
    var resolvedModulePath = path.resolve('path/to/module1');
    shell.moduleManifests = {'path/to/module1': {physicalPath: resolvedModulePath}};
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
    var resolvedOtherModulePath = path.resolve('path/to/other-module');
    var resolvedOtherOtherModulePath = path.resolve('path/to/other-other-module');
    shell.moduleManifests = {
      'path/to/other-module': {physicalPath: resolvedOtherModulePath},
      'path/to/other-other-module': {physicalPath: resolvedOtherOtherModulePath}
    };
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
    var resolvedDependencyModulePath = path.resolve('path/to/dependency');
    var resolvedDependentModulePath = path.resolve('path/to/dependent');
    shell.moduleManifests = {
      'path/to/dependency': {physicalPath: resolvedDependencyModulePath},
      'path/to/dependent': {physicalPath: resolvedDependentModulePath}
    };
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
    var resolvedPathToDependency = path.resolve('path/to/dependency');
    var resolvedPathToDependent = path.resolve('path/to/dependent');
    shell.moduleManifests = {
      'path/to/dependency': {physicalPath: resolvedPathToDependency},
      'path/to/dependent': {physicalPath: resolvedPathToDependent}
    };
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
      .to.deep.equal([resolvedPathToFileInDependent, resolvedPathToFileInDependency]);
  });

  it('can find deep paths', function() {
    var shell = new Shell();
    shell.modules = ['path/to/module1'];
    var resolvedModulePath = path.resolve('path/to/module1');
    shell.moduleManifests = {'path/to/module1': {physicalPath: resolvedModulePath}};
    var resolvedPathToFolder = path.resolve('path/to/module1/foo');
    var resolvedPathToFile = path.resolve('path/to/module1/foo/bar.baz');
    var stubs = {
      fs: {
        existsSync: function (p) {
          return p === resolvedPathToFile || p === resolvedPathToFolder;
        }
      }
    };
    var FileResolver = proxyquire('../lib/file-resolution', stubs);
    var fileResolver = new FileResolver(shell);
    var resolvedPath = fileResolver.resolve('foo', 'bar.baz');

    expect(resolvedPath)
      .to.equal(resolvedPathToFile);
  });

  it('can find by regular expression', function() {
    var shell = new Shell();
    shell.modules = ['path/to/module1'];
    var resolvedModulePath = path.resolve('path/to/module1');
    shell.moduleManifests = {'path/to/module1': {physicalPath: resolvedModulePath}};
    var resolvedPathToModuleRoot = path.resolve('path/to/module1');
    var resolvedPathToFolder = path.resolve('path/to/module1/foo');
    var resolvedPathToFile = path.resolve('path/to/module1/foo/baz.js');
    var stubs = {
      fs: {
        readdirSync: function(p) {
          if (p === resolvedPathToModuleRoot) return ['foo', 'foofoo', 'bar', 'baz'];
          if (p === resolvedPathToFolder) return ['baz.js', 'baz.json', 'baz.md', 'foo.bar'];
        }
      }
    };
    var FileResolver = proxyquire('../lib/file-resolution', stubs);
    var fileResolver = new FileResolver(shell);
    var resolvedPath = fileResolver.resolve(/^foo.*$/i, /^baz\.js.*$/i);

    expect(resolvedPath)
      .to.equal(resolvedPathToFile);
  });

  it('can find all by regular expression', function() {
    var shell = new Shell();
    shell.modules = ['path/to/module1'];
    var resolvedPathToModuleRoot = path.resolve('path/to/module1');
    shell.moduleManifests = {
      'path/to/module1': {physicalPath: resolvedPathToModuleRoot}
    };
    var resolvedPathToFolder1 = path.resolve('path/to/module1/foo');
    var resolvedPathToFolder2 = path.resolve('path/to/module1/foofoo');
    var resolvedPathToFile1 = path.resolve('path/to/module1/foo/baz.js');
    var resolvedPathToFile2 = path.resolve('path/to/module1/foo/baz.json');
    var resolvedPathToFile3 = path.resolve('path/to/module1/foofoo/baz.json');
    var stubs = {
      fs: {
        readdirSync: function(p) {
          if (p === resolvedPathToModuleRoot) return ['foo', 'foofoo', 'bar', 'baz'];
          if (p === resolvedPathToFolder1) return ['baz.js', 'baz.json', 'baz.md', 'foo.bar'];
          if (p === resolvedPathToFolder2) return ['baz.json', 'baz.md', 'foo.bar'];
        }
      }
    };
    var FileResolver = proxyquire('../lib/file-resolution', stubs);
    var fileResolver = new FileResolver(shell);
    var resolvedPaths = fileResolver.all(/^foo.*$/i, /^baz\.js.*$/i);

    expect(resolvedPaths)
      .to.deep.equal([resolvedPathToFile1, resolvedPathToFile2, resolvedPathToFile3]);
  });

  it('resolves mixed regular expression and string paths', function() {
    var shell = new Shell();
    shell.modules = ['path/to/module1'];
    var resolvedPathToModuleRoot = path.resolve('path/to/module1');
    shell.moduleManifests = {
      'path/to/module1': {physicalPath: resolvedPathToModuleRoot}
    };
    var resolvedPathToFile1 = path.resolve('path/to/module1/foo/baz.js');
    var resolvedPathToFile2 = path.resolve('path/to/module1/foofoo/baz.js');
    var stubs = {
      fs: {
        readdirSync: function (p) {
          if (p === resolvedPathToModuleRoot) return ['foo', 'foofoo', 'bar', 'baz'];
        },
        existsSync: function (p) {
          return p === resolvedPathToFile1 || p === resolvedPathToFile2;
        }
      }
    };
    var FileResolver = proxyquire('../lib/file-resolution', stubs);
    var fileResolver = new FileResolver(shell);
    var resolvedPath = fileResolver.resolve(/^foo.*$/i, 'baz.js');
    var resolvedPaths = fileResolver.all(/^foo.*$/i, 'baz.js');

    expect(resolvedPath)
      .to.equal(resolvedPathToFile1);
    expect(resolvedPaths)
      .to.deep.equal([resolvedPathToFile1, resolvedPathToFile2]);
  });

  it('caches results and misses', function() {
    var shell = new Shell();
    shell.modules = ['path/to/module1'];
    var resolvedPathToModuleRoot = path.resolve('path/to/module1');
    shell.moduleManifests = {
      'path/to/module1': {physicalPath: resolvedPathToModuleRoot}
    };
    var resolvedPathToFile1 = path.resolve('path/to/module1/foo/baz.js');
    var resolvedPathToFile2 = path.resolve('path/to/module1/foofoo/baz.js');
    var stubs = {
      fs: {
        readdirSync: function(p) {
          if (p === resolvedPathToModuleRoot) return ['foo', 'foofoo', 'bar', 'baz'];
        },
        existsSync: function (p) {
          return p === resolvedPathToFile1 || p === resolvedPathToFile2;
        }
      }
    };
    var FileResolver = proxyquire('../lib/file-resolution', stubs);
    var fileResolver = new FileResolver(shell);
    var cacheKey = fileResolver.getCacheKey([/^foo.*$/i, 'baz.js']);
    var resolvedPath = fileResolver.resolve(/^foo.*$/i, 'baz.js');
    var resolvedPaths = fileResolver.all(/^foo.*$/i, 'baz.js');
    var nope = 'does/not/exist';
    var miss = fileResolver.resolve(nope);
    var missall = fileResolver.all(nope);

    expect(shell.resolvedFiles[cacheKey])
      .to.equal(resolvedPath);
    expect(shell.resolvedFilesAll[cacheKey])
      .to.equal(resolvedPaths);
    expect(shell.resolvedFiles)
      .to.have.property(nope, null);
    expect(shell.resolvedFilesAll[nope])
      .to.deep.equal([]);

    // Remove the files, then hit the API again
    stubs.fs.readdirSync = function(p) {return [];};
    expect(fileResolver.resolve(/^foo.*$/i, 'baz.js'))
      .to.equal(resolvedPath);
    expect(fileResolver.all(/^foo.*$/i, 'baz.js'))
      .to.equal(resolvedPaths);
  });
});
