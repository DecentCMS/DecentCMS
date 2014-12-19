// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var fs = require('fs');
var RenderStream = require('./render-stream');
var dust = require('dustjs-linkedin');
dust.helper = require('dustjs-helpers');

dust.helpers.shape = function shapeDustHelper(chunk, context, bodies, params) {
  var shape = dust.helpers.tap(params.shape, chunk, context);
  var tag = dust.helpers.tap(params.tag, chunk, context);
  var cssClass = dust.helpers.tap(params.class, chunk, context);
  var renderer = chunk.root['decent-renderer'];
  return chunk.map(function renderShapeFromDust(chunk) {
    var innerRenderer = new RenderStream(renderer.scope, {
      scripts: renderer.scripts,
      stylesheets: renderer.stylesheets,
      meta: renderer.meta,
      title: renderer.title
    });
    innerRenderer.on('data', function onShapeData(data) {
      chunk.write(data);
    });
    innerRenderer
      .shape(shape, tag, {class: cssClass})
      .finally(function() {
        chunk.end();
      });
  });
};

function getDustTemplate(templatePath) {
  return function dustTemplate(shape, renderer, next) {
    var stream = dust.stream(templatePath, shape)
      .on('data', function(data) {
        renderer.write(data);
      })
      .on('end', next)
      .on('error', function(err) {throw err;});
    stream['decent-renderer'] = renderer;
  };
}

/**
 * @description
 * A view engine using Dust templates.
 * http://akdubya.github.io/dustjs/
 * https://github.com/linkedin/dustjs/wiki/Dust-Tutorial
 *
 * The view engine exposes by default the standard helpers:
 * https://github.com/linkedin/dustjs-helpers
 *
 * It adds a 'shape' helper that enables the rendering of
 * DecentCMS shapes. The shape helper takes a 'shape' parameter
 * that should point to the shape object to render.
 * Optional parameters are tag and class.
 */
var codeViewEngine = {
  service: 'view-engine',
  feature: 'dust-view-engine',
  extension: 'dust',
  scope: 'shell',
  /**
   * @description
   * Loads the rendering function from the provided path.
   * @param {string} templatePath The path to the .dust file.
   * @param {Function} done The callback function to call when the template is loaded.
   * @returns {function} The template function.
   */
  load: function loadCodeTemplate(templatePath, done) {
    if (dust.cache.hasOwnProperty(templatePath)) {
      return done(getDustTemplate(templatePath));
    }
    fs.readFile(templatePath, function readTemplate(err, template) {
      dust.register(templatePath, dust.loadSource(dust.compile(template, templatePath)));
      done(getDustTemplate(templatePath));
    });
  }
};

module.exports = codeViewEngine;