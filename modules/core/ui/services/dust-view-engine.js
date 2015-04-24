// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A view engine using Dust templates.
 * http://akdubya.github.io/dustjs/
 * https://github.com/linkedin/dustjs/wiki/Dust-Tutorial
 *
 * The view engine exposes by default the standard helpers:
 * https://github.com/linkedin/dustjs-helpers
 *
 * Helpers
 * =======
 *
 * T
 * -
 * Makes the enclosed string localizable.
 *
 *     {@t}Text to localize{/t}
 *
 * Shape
 * -----
 * It adds a 'shape' helper that enables the rendering of
 * DecentCMS shapes. The shape helper takes a 'shape' parameter
 * that should point to the shape object to render.
 * Optional parameters are tag and class.
 *
 *     {@shape shape=footer tag="footer" class="main-footer"/}
 *
 * Style
 * -----
 * Registers a style sheet.
 * Use the non-minimized name, without extension, as the name parameter.
 *
 *     {@style name="style"/}
 *
 * Styles
 * ------
 * Renders the list of registered styles.
 *
 *     {@styles/}
 *
 * Script
 * ------
 * Registers a script.
 * Use the non-minimized name, without extension, as the name parameter.
 *
 *     {@script name="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.js"/}
 *
 * Scripts
 * -------
 * Renders the list of registered scripts.
 *
 *     {@scripts/}
 *
 * Meta
 * ----
 * Registers a meta tag.
 * name: the name of the tag
 * value: the value of the tag (rendered as the content attribute)
 * Additional attributes will be rendered as-is.
 *
 *     {@meta name="generator" value="DecentCMS"/}
 *
 * Metas
 * -----
 * Renders registered meta tags.
 *
 *     {@metas/}
 */
var CodeViewEngine = function CodeViewEngine(scope) {
  this.scope = scope;

  var RenderStream = require('./render-stream');
  var dust = require('dustjs-linkedin');
  dust.config.whitespace = !!scope.debug;
  dust.helper = require('dustjs-helpers');

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

  dust.helpers.shape = function shapeDustHelper(chunk, context, bodies, params) {
    var theShape = dust.helpers.tap(params.shape, chunk, context);
    if (!theShape) {
      return chunk.map(function renderEmpty(chunk) {chunk.end();});
    }
    // Clone the shape, so that its attributes can be changed between different
    // renderings of the same shape.
    // Warning: shallow copy, so weird things may still happen for object and
    // array properties.
    var shape = {meta: theShape.meta, temp: theShape.temp};
    Object.getOwnPropertyNames(theShape)
      .forEach(function(propertyName) {
        if (propertyName === 'meta' || propertyName == 'temp') return;
        shape[propertyName] = theShape[propertyName];
      });
    var name, tag;
    var attributes = {};
    Object.getOwnPropertyNames(params)
      .forEach(function(paramName) {
        var param = dust.helpers.tap(params[paramName], chunk, context);
        switch(paramName) {
          case 'shape': break;
          case 'name':
            name = param;
            break;
          case 'tag':
            tag = param;
            break;
          case 'class':
            attributes['class'] = param;
            break;
          case 'style':
            attributes.style = param;
            break;
          default:
            if (paramName.substr(0, 5) === 'data-') {
              attributes[paramName] = param;
            }
            else {
              shape[paramName] = param;
            }
        }
      });
    var renderer = chunk.root['decent-renderer'];
    return chunk.map(function renderShapeFromDust(chunk) {
      var innerRenderer = new RenderStream(renderer.scope, {
        scripts: renderer.scripts,
        stylesheets: renderer.stylesheets,
        meta: renderer.meta,
        title: renderer.title
      });
      innerRenderer
        .on('data', function onShapeData(data) {
          chunk.write(data);
        })
        .onError(function(err) {
          renderer._onError(err);
          chunk.end();
        });
      innerRenderer
        .shape({shape: shape, tag: tag, attributes: attributes, shapeName: name})
        .finally(function() {
          chunk.end();
        });
    });
  };

  dust.helpers.t = function localizationDustHelper(chunk, context, bodies) {
    var renderer = chunk.root['decent-renderer'];
    var scope = renderer.scope;
    var t = scope.require('localization') || function(s) {return s;};
    var body = dust.helpers.tap(bodies.block, chunk, context);
    var localizedBody = t(body);
    var reTokenized = localizedBody.replace(/\[([^\]]+)]/g, '{$1}');
    dust.loadSource(dust.compile(reTokenized, reTokenized));
    return chunk.map(function renderLocalizedString(chunk) {
      dust.render(reTokenized, context, function(err, rendered) {
        chunk.end(rendered);
      });
    });
  };

  dust.helpers.style = function styleDustHelper(chunk, context, bodies, params) {
    var stylesheet = dust.helpers.tap(params.name, chunk, context);
    if (!stylesheet) return;
    var renderer = chunk.root['decent-renderer'];
    if (/^(https?:)?\/\//.test(stylesheet)) {
      renderer._addExternalStyleSheet(stylesheet);
    }
    else {
      renderer._addStyleSheet(stylesheet);
    }
    return chunk;
  };

  dust.helpers.styles = function stylesDustHelper(chunk, context, bodies, params) {
    var renderer = chunk.root['decent-renderer'];
    var innerRenderer = new RenderStream(renderer.scope, {
      stylesheets: renderer.stylesheets
    });
    var html = '';
    innerRenderer.on('data', function onShapeData(data) {
      html += data;
    });
    innerRenderer._renderStyleSheets();
    return chunk.write(html);
  };

  dust.helpers.script = function scriptDustHelper(chunk, context, bodies, params) {
    var script = dust.helpers.tap(params.name, chunk, context);
    if (!script) return;
    var renderer = chunk.root['decent-renderer'];
    if (/^(https?:)?\/\//.test(script)) {
      renderer._addExternalScript(script);
    }
    else {
      renderer._addScript(script);
    }
    return chunk;
  };

  dust.helpers.scripts = function scriptsDustHelper(chunk, context, bodies, params) {
    var renderer = chunk.root['decent-renderer'];
    var innerRenderer = new RenderStream(renderer.scope, {
      scripts: renderer.scripts
    });
    var html = '';
    innerRenderer.on('data', function onShapeData(data) {
      html += data;
    });
    innerRenderer._renderScripts();
    return chunk.write(html);
  };

  dust.helpers.meta = function metaDustHelper(chunk, context, bodies, params) {
    var attributes = {};
    var name = null;
    var value = '';
    Object.getOwnPropertyNames(params).forEach(function forEachParam(attrName) {
      switch(attrName) {
        case 'name':
          name = dust.helpers.tap(params.name, chunk, context);
          break;
        case 'value':
          value = dust.helpers.tap(params.value, chunk, context);
          break;
        default:
          attributes[attrName] = dust.helpers.tap(params[attrName], chunk, context);
      }
    });
    var renderer = chunk.root['decent-renderer'];
    renderer._addMeta(name, value, attributes);
    return chunk;
  };

  dust.helpers.metas = function metasDustHelper(chunk, context, bodies, params) {
    var renderer = chunk.root['decent-renderer'];
    var innerRenderer = new RenderStream(renderer.scope, {
      meta: renderer.meta
    });
    var html = '';
    innerRenderer.on('data', function onShapeData(data) {
      html += data;
    });
    innerRenderer._renderMeta();
    return chunk.write(html);
  };

  /**
   * @description
   * Loads the rendering function from the provided path.
   * @param {string} templatePath The path to the .dust file.
   * @param {Function} done The callback function to call when the template is loaded.
   * @returns {function} The template function.
   */
  this.load = function loadCodeTemplate(templatePath, done) {
    var fs = require('fs');
    if (dust.cache.hasOwnProperty(templatePath)) {
      return done(getDustTemplate(templatePath));
    }
    fs.readFile(templatePath, function readTemplate(err, template) {
      dust.register(
        templatePath,
        dust.loadSource(dust.compile(template.toString(), templatePath))
      );
      done(getDustTemplate(templatePath));
    });
  };
};
CodeViewEngine.service = 'view-engine';
CodeViewEngine.feature = 'dust-view-engine';
CodeViewEngine.scope = 'shell';
CodeViewEngine.prototype.extension = 'tl';

module.exports = CodeViewEngine;