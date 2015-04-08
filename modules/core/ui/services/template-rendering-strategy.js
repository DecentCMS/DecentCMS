// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A rendering strategy that uses templates files, going through view engines.
 * @param {object} scope The scope.
 * @constructor
 */
function TemplateRenderingStrategy(scope) {
  var fs = require('fs');
  var path = require('path');

  this.scope = scope;
  var fileResolver = scope.require('file-resolution');
  var shapeHelper = scope.require('shape');
  var viewEngines = scope.getServices('view-engine');
  var extensionExpression = '(' + viewEngines
      .map(function(viewEngine) {return viewEngine.extension;})
      .join('|') + ')';
  var viewEngineMap = {};
  for (var i = 0; i < viewEngines.length; i++) {
    viewEngineMap[viewEngines[i].extension] = viewEngines[i];
  }
  var shapeTemplates = scope.shapeTemplates = scope.shapeTemplates || {};

  /**
   * Uses templates to recursively render shapes into HTML.
   *
   * The method resolves templates based on module and theme dependencies
   * and priorities.
   *
   * Each shape can also have a list of alternate template names that
   * will take precedence over the shape name to resolve a template name,
   * if found.
   *
   * @param {object} context The context.
   * @param {object} context.shape The shape to render.
   * @param {string} [context.shapeName]
   * The name of the shape to render.
   * If not specified, `context.shape.meta.type` will be used,
   * and if that is not found, 'zone' is used.
   * @param {object} context.renderStream The render stream.
   * @param {Function} done The callback.
   */
  this.render = function(context, done) {
    var shape = context.shape;
    var renderer = context.renderStream;
    var temp = shapeHelper.temp(shape);
    if (temp.html) {
      renderer.write(temp.html);
      return done();
    }
    var shapeName = context.shapeName;
    if (!shapeName) {
      var meta = shapeHelper.meta(shape);
      shapeName = meta.type || (meta.type = 'zone');
    }
    var alternates = shapeHelper.alternates(shape).slice();
    alternates.push(shapeName);
    for (var i = 0; i < alternates.length; i++) {
      var alternate = alternates[i];
      var template = shapeTemplates[alternate];
      if (!template) {
        var templatePath = fileResolver.resolve(
          'views', new RegExp(alternate + '\\.' + extensionExpression));
        if (templatePath) {
          var extension = path.extname(templatePath).substr(1);
          var viewEngine = viewEngineMap[extension];
          viewEngine.load(templatePath, function onTemplateLoaded(template) {
            shapeTemplates[alternate] = template;
            template(shape, renderer, done);
          });
          return;
        }
      }
      else {
        shapeTemplates[alternate] = template;
        template(shape, renderer, done);
        return;
      }
    }
    done(new Error('Template for ' + alternate + ' not found.'));
  };
}
TemplateRenderingStrategy.service = 'rendering-strategy';
TemplateRenderingStrategy.scope = 'shell';
TemplateRenderingStrategy.feature = 'template-rendering-strategy';
TemplateRenderingStrategy.dependencies = ['decent-core-io'];

module.exports = TemplateRenderingStrategy;