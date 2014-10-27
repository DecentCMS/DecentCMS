// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var fs = require('fs');

/**
 * @description
 * A view engine using the Token API, which uses Markup.js.
 * See https://github.com/adammark/Markup.js/ for details about
 * Markup.js.
 * @param {Shell} shell
 * @constructor
 */
var MarkupViewEngine = function(shell) {
  this.shell = shell;
};
MarkupViewEngine.service = 'view-engine';
MarkupViewEngine.feature = 'markup-view-engine';

MarkupViewEngine.prototype.extension = 'markup';

/**
 * @description
 * Loads a template from the file system.
 * @param {string} templatePath The path to the template.
 * @returns {function} The compiled template.
 */
MarkupViewEngine.prototype.load = function (templatePath) {
  return this.compile(fs.readdirSync(templatePath));
};

/**
 * @description
 * Returns a function for the template that takes a shape as
 * the view model.
 * @param {string} template The template.
 * @returns {Function} The template function.
 */
MarkupViewEngine.prototype.compile = function (template) {
  var token = this.shell.require('token');
  return function (shape) {
    return token.interpolate(template, shape);
  };
};

module.exports = MarkupViewEngine;