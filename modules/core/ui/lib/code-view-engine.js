// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A view engine where templates are JavaScript functions.
 * @param {Shell} shell The shell.
 * @constructor
 */
var CodeViewEngine = function(shell) {
  this.shell = shell;
};
CodeViewEngine.isShellSingleton = true;

CodeViewEngine.extension = CodeViewEngine.prototype.extension = "js";

/**
 * @description
 * Loads the rendering function from the provided path.
 * @param {string} templatePath The path to the JavaScript file.
 * @returns {function} The template function.
 */
CodeViewEngine.prototype.load = function(templatePath) {
  return require(templatePath);
};

module.exports = CodeViewEngine;