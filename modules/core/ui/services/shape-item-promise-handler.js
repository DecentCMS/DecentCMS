// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * This shape is the place holder that the content manager puts into
 * the shape tree when only the id is known, so we don't fetch content
 * items earlier than necessary.
 *
 * This handler replaces the promise shape with a content shape with
 * local zones under it that carry the placed part shapes.
 */
var ShapeItemPromiseHandler = {
  feature: 'shape',
  service: 'shape-handler',
  /**
   * Adds an actual content shape for the content item from
   * its `shape-item-promise` shape.
   *
   * It then executes a local lifecycle for the new content
   * shape, that goes through the following phases:
   * * `shape-handler.handle`: gives a chance for handlers to handle
   *   the new shapes and create new ones.
   * * `placement-strategy.placeShapes`: the new shapes created above
   *   can be dispatched to zones.
   *
   * @param {object} context The context.
   * @param {object} context.scope The scope.
   * @param {object} context.shape The promise shape.
   * @param {object} context.renderStream The render stream.
   */
  handle: function handleShapeItemPromise(context, done) {
    var scope = context.scope;
    var itemShape = context.shape;
    var shapeMeta = itemShape.meta;
    if (!shapeMeta || shapeMeta.type !== 'shape-item-promise') return done();

    var renderer = context.renderStream;
    var storageManager = scope.require('storage-manager');
    var item = storageManager.getAvailableItem(itemShape.id);
    if (!item) {
      done();
      return;
    }
    // Morph the shape into a content shape, then copy the item onto it.
    shapeMeta.type = 'content';
    var shape = scope.require('shape');
    var shapeTemp = shape.temp(itemShape);
    shapeTemp.item = item;
    // Add content-theType and content-stereotype alternates.
    var alternates = shape.alternates(itemShape);
    alternates.push('content-' + item.meta.type);
    var splitId = item.id.split(':');
    if (splitId.length > 1) {
      alternates.push('content-' + splitId[0]);
    }
    // Start a new local lifecycle to build the shapes under this content.
    shapeTemp.shapes = [];
    var localContext = {
      scope: scope,
      shape: itemShape,
      renderStream: renderer
    };
    var lifecycle = scope.lifecycle(
      // Shape handlers will fill the shapes array
      'shape-handler', 'handle',
      function addShapesToLocalContext(localContext, next) {
        localContext.shapes = shapeTemp.shapes;
        delete shapeTemp.shapes;
        next();
      },
      // Dispatch the shapes array using placement
      'placement-strategy', 'placeShapes'
    );
    lifecycle(localContext, done);
  }
};

module.exports = ShapeItemPromiseHandler;