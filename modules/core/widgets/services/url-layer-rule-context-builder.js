// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * A layer rule context builder the exposes the current URL
 * to layer rules.
 * @constructor
 */
function UrlLayerRuleContextBuilder(scope) {
  this.scope = scope;
}
UrlLayerRuleContextBuilder.scope = 'request';
UrlLayerRuleContextBuilder.service = 'layer-rule-context-builder';
UrlLayerRuleContextBuilder.feature = 'widgets';

/**
 * Adds the current URL to the context under the name 'url'.
 * @param {object} context The context.
 */
UrlLayerRuleContextBuilder.prototype.buildContext = function(context, next) {
  context.url = this.scope.url;
  next();
};

module.exports = UrlLayerRuleContextBuilder;