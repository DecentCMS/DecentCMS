// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A rendering strategy that uses templates files, going through view engines.
 * @param shell
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

  this.render = function(context, done) {
    var shape = context.shape;
    var renderer = context.renderStream;
    var temp = shapeHelper.temp(shape);
    if (temp.html) {
      renderer.write(temp.html);
      return done();
    }
    var meta = shapeHelper.meta(shape);
    var shapeName = meta.type;
    if (!shapeName) {
      shapeName = meta.type = 'zone';
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