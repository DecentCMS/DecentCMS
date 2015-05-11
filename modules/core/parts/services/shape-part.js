// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * The shape part handler creates shapes from raw content parts without the need
 * for a specific handler.
 */
var ShapePart = {
  feature: 'core-parts',
  service: 'shape-handler',
  /**
   * Adds a shape to `context.shape.temp.shapes` for each part that has a 'shape'
   * property.
   * The specific type of shape to transform the part object into is specified
   * by the `meta.shape` property of the part.
   * @param {object} context The context object.
   * @param {object} context.shape The shape to handle. Its `meta.shape` property is the name of the shape to create. If not found, the shape is looked for on the type.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleShapePart(context, done) {
    var content = context.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp) return done();
    var temp = content.temp;
    var item = temp.item;
    var scope = context.scope;
    var shapeHelper = scope.require('shape');
    var contentManager = scope.require('content-manager');
    var type = contentManager.getType(item);
    Object.getOwnPropertyNames(item).forEach(function(partName) {
      if (partName === 'meta' || partName === 'temp') return;
      var part = item[partName];
      if (!part) return;
      var shapeName = (part.meta ? part.meta.shape : null)
        || (type && type.parts[partName] ? type.parts[partName].shape : null)
        || null;
      if (shapeName) {
        var meta = shapeHelper.meta(part);
        delete meta.shape;
        meta.type = shapeName;
        meta.name = partName;
        meta.alternates = [shapeName + '-' + partName];
        meta.item = item;
        shapeHelper.temp(part).displayType = temp.displayType;
        temp.shapes.push(part);
      }
    });
    done();
  }
};

module.exports = ShapePart;