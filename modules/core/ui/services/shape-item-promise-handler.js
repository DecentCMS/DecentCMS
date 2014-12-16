// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * This shape is the place holder that the content manager puts into
 * the shape tree when only the id is known, so we don't fetch content
 * items earlier than necessary.
 * This handler replaces the promise shape with a content shape with
 * local zones under it that carry the placed part shapes.
 */
var ShapeItemPromiseHandler = {
  feature: 'shape',
  service: 'content-handler',
  handleItem: function handleShapeItemPromise(context, done) {
    var scope = context.scope;
    var itemShape = context.shape;
    var shapeMeta = itemShape.meta;
    if (!shapeMeta || shapeMeta.type !== 'shape-item-promise') return done();

    var renderer = context.renderStream;
    var storageManager = scope.require('storage-manager');
    var item = storageManager.getAvailableItem(itemShape.id);
    // Morph the shape into a content shape, then copy the item onto it.
    shapeMeta.type = 'content';
    var shapeTemp = itemShape.temp = itemShape.temp || {};
    shapeTemp.item = item;
    shapeTemp.shapes = [];
    var localContext = {
      scope: scope,
      shape: itemShape,
      renderStream: renderer
    };
    var lifecycle = scope.lifecycle(
      // Part handlers will fill the shapes array
      'content-handler', 'handleItem',
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