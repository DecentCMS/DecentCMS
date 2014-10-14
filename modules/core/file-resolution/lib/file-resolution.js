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
 * @param {Shell} shell the shell
 * @constructor
 */
var FileResolution = function(shell) {
  this.shell = shell;
  this.shell.resolvedFiles = {};
  this.shell.resolvedFilesAll = {};
};

FileResolution.isShellSingleton = true;

/**
 * @description
 * Resolves local paths to the physical path of the file in the
 * first module in dependency order (most dependent modules are
 * first) that has it. For example, if module1 and module 2 both
 * have the file, but a service in module 2 depends on module 1,
 * then the path of the file in module 2 is returned.
 * @param {String} filePath The local path under the module's root of the file to find.
 * @returns {String} The physical path of the found file, or null if it wasn't found.
 */
FileResolution.prototype.resolve = function(filePath) {
  var resolvedFiles = this.shell.resolvedFiles;
  if (filePath in resolvedFiles) {
    return resolvedFiles[filePath];
  }
  var modules = this.shell.modules;
  if (modules.length === 0) return null;
  for (var i = modules.length - 1; i >= 0; i--) {
    var module = modules[i];
    var realPath = path.resolve(module, filePath);
    if (fs.existsSync(realPath)) {
      resolvedFiles[filePath] = realPath;
      return realPath;
    }
  };
  return null;
};

/**
 * @description
 * Finds all occurrences of the file whose path is passed in,
 * in order of dependency, from the most dependent to the least
 * dependent.
 * @param {String} filePath The local path under the module's root of the file to find.
 * @returns {Array} The list of paths found.
 */
FileResolution.prototype.all = function(filePath) {
  var resolvedFilesAll = this.shell.resolvedFilesAll;
  if (filePath in resolvedFilesAll) {
    return resolvedFilesAll[filePath];
  }
  var results = [];
  var modules = this.shell.modules;
  if (modules.length === 0) return null;
  for (var i = modules.length - 1; i >= 0; i--) {
    var module = modules[i];
    var realPath = path.resolve(module, filePath);
    if (fs.existsSync(realPath)) {
      results.push(realPath);
    }
  };
  resolvedFilesAll[filePath] = results;
  return results;
}

module.exports = FileResolution;