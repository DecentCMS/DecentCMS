// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: find a way for widgets not to be fetched on non-themed requests

/**
 * @description
 * A route handler that determines what widgets to render for this request.
 */
function WidgetRouteHandler(scope) {
  this.scope = scope;
}
WidgetRouteHandler.service = 'route-handler';
WidgetRouteHandler.feature = 'widgets';
WidgetRouteHandler.isScopeSingleton = true;
WidgetRouteHandler.scope = 'request';

/**
 * Calls into layer stores and evaluates their rules in context,
 * in order to determine what layers should be active for the current request.
 * The widgets in those layers are then promised to be rendered.
 * 
 * @param {object} context The context.
 * @param {Function} next The callback.
 */
WidgetRouteHandler.prototype.handle = function handleForWidgets(context, next) {
  var scope = this.scope;
  var shell = scope.require('shell');
  var ruleAstCache = shell['layer-rule-ast-cache'] || (shell['layer-rule-ast-cache'] = {});
  var loadLayerContext = {};
  scope.callService('layer-store', 'loadLayers',
    loadLayerContext, function onLayersLoaded(err) {

      var layers = loadLayerContext.layers;
      if (!layers) {
        next();
        return;
      }
      var ruleEvaluationScope = {};
      scope.callService('layer-rule-context-builder', 'buildContext',
        ruleEvaluationScope, function onRuleContextBuilt(err) {

          var evaluate = require('static-eval');
          var parse = require('esprima').parse;

          var renderer = scope.require('renderer');
          Object.getOwnPropertyNames(layers).forEach(function forEachLayer(layerName) {
            var layer = layers[layerName];
            var rule = layer.rule || "true";
            var ruleAst = ruleAstCache[rule] || (ruleAstCache[rule] = parse(rule).body[0].expression);
            if (evaluate(ruleAst, ruleEvaluationScope)) {
              var widgets = layer.widgets;
              if (widgets) {
                widgets.forEach(function (widget) {
                  renderer.promiseToRender(widget);
                });
              }
            }
          });
          next();
        });
    });
};

module.exports = WidgetRouteHandler;