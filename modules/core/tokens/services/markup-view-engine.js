// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var fs = require('fs');

/**
 * @description
 * A view engine using the Token API, which uses Markup.js.
 * See https://github.com/adammark/Markup.js/ for details about
 * Markup.js.
 * @param {object} scope
 * @constructor
 */
var MarkupViewEngine = function(scope) {
  this.scope = scope;
};
MarkupViewEngine.service = 'view-engine';
MarkupViewEngine.feature = 'markup-view-engine';

MarkupViewEngine.prototype.extension = 'markup';

/**
 * @description
 * Loads the rendering function from the provided path.
 * @param {string} templatePath The path to the JavaScript file.
 * @param {function} done The callback function to call when the template is loaded.
 * @returns {function} The template function.
 */
MarkupViewEngine.prototype.load = function loadMarkupTemplate(templatePath, done) {
  var token = this.scope.require('token');
  fs.readFile(templatePath, function readTemplate(template) {
    done(function markupTemplate(shape, renderer, doneRendering) {
      renderer.write(token.interpolate(template, shape));
      doneRendering();
    });
  });
};

module.exports = MarkupViewEngine;