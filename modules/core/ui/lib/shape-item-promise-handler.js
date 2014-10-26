// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * This shape is the place holder that the content manager puts into
 * the shape tree when only the id is known, so we don't fetch content
 * items earlier than necessary.
 * This handler replaces the promise shape with a content shape with
 * local zones under it that carry the placed part shapes.
 * @param shapeItemPromise The item promise shape.
 * @param renderer         The rendering stream.
 * @param shell            The shell.
 */
var ShapeItemPromiseHandler = {
  on: {
    'decent.core.handle-item': function (shell, options) {
      var itemShape = options.shape;
      var shapeMeta = itemShape.meta;
      if (!shapeMeta || shapeMeta.type !== 'shape-item-promise') return;

      var renderer = options.renderStream;
      var contentManager = renderer.contentManager;
      var item = contentManager.getAvailableItem(itemShape.id);
      // Morph the shape into a content shape, then copy the item onto it.
      shapeMeta.type = 'content';
      var shapeTemp = itemShape.temp = itemShape.temp || {};
      shapeTemp.item = item;
      shapeTemp.shapes = [];
      // Part handlers will fill the shapes array
      shell.emit('decent.core.handle-item', {
        shape: itemShape,
        renderStream: renderer
      });
      var shapes = shapeTemp.shapes;
      delete shapeTemp.shapes;
      // Dispatch the shapes array using placement
      shell.emit('decent.core.shape.placement', {
        shape: itemShape,
        shapes: shapes
      });
    }
  }
};

module.exports = ShapeItemPromiseHandler;