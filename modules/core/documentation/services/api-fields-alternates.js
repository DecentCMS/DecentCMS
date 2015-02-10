// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Adds text-scope, text-feature, and text-service to the alternates
 * for the text fields of the same names on api-documentation items.
 */
module.exports = {
  service: 'shape-handler',
  feature: 'documentation',
  scope: 'shell',
  /**
   * Adds text-scope, text-feature, and text-service to the alternates
   * for the text fields of the same names on api-documentation items.
   * @param context The context object.
   * @param {object} context.shape The shape to be handled.
   * @param {object} context.scope The scope.
   * @param {function} done the callback.
   */
  handle: function addApiFieldAlternates(context, done) {
    var shape = context.shape;
    var shapeHelper = context.scope.require('shape');
    var shapeMeta = shapeHelper.meta(shape);
    if (shapeMeta && shapeMeta.type === 'text'
        && shapeMeta.item && shapeMeta.item.meta && shapeMeta.item.meta.type === 'api-documentation'
        && shapeMeta.name && ['scope', 'feature', 'service'].indexOf(shapeMeta.name) !== -1) {
      shapeHelper.alternates(shape).push('api-field');
    }
    done();
  }
};