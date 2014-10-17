// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var fs = require('fs');
var path = require('path');

/**
 * @description
 * Resolves local paths to the physical path of the file in the
 * first module in dependency order (most dependent modules are
 * first) that has it. For example, if module1 and module 2 both
 * have the file, but a service in module 2 depends on module 1,
 * then the path of the file in module 2 is returned.
 *
 * @param {Shell} shell the shell
 * @constructor
 */
var FileResolution = function(shell) {
  this.shell = shell;
  this.shell.resolvedFiles = this.shell.resolvedFiles || {};
  this.shell.resolvedFilesAll = this.shell.resolvedFilesAll || {};
};

FileResolution.isShellSingleton = true;

/**
 * @description
 * Builds a cache key from the string and regular expression path tokens
 * that are passed as arguments.
 *
 * @param {(String|RegExp)[]} pathTokens The local path under the module's
 *  root of the file to find, or the pattern to match. More than one
 *  argument may be passed, each of which can be a string or regular
 *  expression representing the name of parent folders.
 * @returns {String} The cache key.
 */
FileResolution.prototype.getCacheKey = function(pathTokens) {
  // Build a cache key from all the tokens in the path
  return pathTokens.map(function(pathToken) {
    return pathToken instanceof RegExp ? pathToken.source : pathToken;
  }).join('/');
}

/**
 * @description
 * Resolves local paths to the physical path of the file in the
 * first module in dependency order (dependencies are last)
 * that has it. For example, if module1 and module 2 both
 * have the file, but a service in module 2 depends on module 1,
 * then the path of the file in module 2 is returned.
 *
 * @param {String|RegExp} fileName The local path under the module's
 *  root of the file to find, or the pattern to match. More than one
 *  argument may be passed, each of which can be a string or regular
 *  expression representing the name of parent folders.
 * @returns {String} The physical path of the found file, or null if it wasn't found.
 */
FileResolution.prototype.resolve = function(fileName) {
  // Lookup the cache
  var filePath = this.getCacheKey(Array.prototype.slice.call(arguments, 0));
  var resolvedFiles = this.shell.resolvedFiles;
  if (filePath in resolvedFiles) {
    return resolvedFiles[filePath];
  }
  // No hit, loop over the path tokens
  var modules = this.shell.modules;
  if (modules.length === 0) return resolvedFiles[filePath] = null;
  var paths = modules.map(function(p) {return path.resolve(p);});
  paths.reverse();
  for (var i = 0; i < arguments.length; i++) {
    if (paths.length == 0) return resolvedFiles[filePath] = null;
    var nextPaths = [];
    var pathToken = arguments[i];
    if (pathToken instanceof RegExp) {
      for (var j = 0; j < paths.length; j++) {
        var p = paths[j];
        var subs = fs.readdirSync(p);
        for (var k = 0; k < subs.length; k++) {
          var subPath = subs[k];
          if (!pathToken.test(subPath)) continue;
          var fullPath = path.resolve(p, subPath);
          if (i === arguments.length - 1) return resolvedFiles[filePath] = fullPath;
          nextPaths.push(fullPath);
        }
      }
    }
    else {
      for (j = 0; j < paths.length; j++) {
        var fullPath = path.resolve(paths[j], pathToken);
        if (fs.existsSync(fullPath)) {
          if (i === arguments.length - 1) return resolvedFiles[filePath] = fullPath;
          nextPaths.push(fullPath);
        }
      }
    }
    paths = nextPaths;
  }
  return resolvedFiles[filePath] = null;
};

/**
 * @description
 * Finds all occurrences of the file whose path is passed in,
 * in order of dependency, starting from dependencies.
 *
 * @param {String|RegExp} fileName The local path under the module's
 *  root of the file to find, or the pattern to match. More than one
 *  argument may be passed, each of which can be a string or regular
 *  expression representing the name of parent folders.
 * @returns {Array} The list of paths found.
 */
FileResolution.prototype.all = function(fileName) {
  // Lookup the cache
  var filePath = this.getCacheKey(Array.prototype.slice.call(arguments, 0));
  var resolvedFilesAll = this.shell.resolvedFilesAll;
  if (filePath in resolvedFilesAll) {
    return resolvedFilesAll[filePath];
  }
  // No hit, loop over the path tokens
  var results = [];
  var modules = this.shell.modules;
  if (modules.length === 0) return resolvedFiles[filePath] = null;
  var paths = modules.map(function(p) {return path.resolve(p);});
  paths.reverse();
  for (var i = 0; i < arguments.length; i++) {
    if (paths.length == 0) return resolvedFiles[filePath] = null;
    var nextPaths = [];
    var pathToken = arguments[i];
    if (pathToken instanceof RegExp) {
      for (var j = 0; j < paths.length; j++) {
        var p = paths[j];
        var subs = fs.readdirSync(p);
        for (var k = 0; k < subs.length; k++) {
          var subPath = subs[k];
          if (!pathToken.test(subPath)) continue;
          var fullPath = path.resolve(p, subPath);
          if (i === arguments.length - 1) {
            results.push(fullPath);
          }
          else {
            nextPaths.push(fullPath);
          }
        }
      }
    }
    else {
      for (j = 0; j < paths.length; j++) {
        var fullPath = path.resolve(paths[j], pathToken);
        if (fs.existsSync(fullPath)) {
          if (i === arguments.length - 1) {
            results.push(fullPath);
          }
          else {
            nextPaths.push(fullPath);
          }
        }
      }
    }
    paths = nextPaths;
  }
  resolvedFilesAll[filePath] = results;
  return results;
}

module.exports = FileResolution;