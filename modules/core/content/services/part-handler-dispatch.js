// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var async = require('async');

/**
 * This part handler dispatch handler calls part handlers.
 * The part handlers must implement a service name of the form
 * `[part-type]-part-handler` with a handle method that.
 * takes a context object and a callback function.
 * The context object has the following structure:
 * 
 * Param       | Type   | Description
 * ------------|--------|------------------------------------------------------------------
 * part        | *      | The part to handle.
 * partName    | string | The name of the part.
 * displayType | string | The display type.
 * item        | object | The content item that the part is a part of.
 * shapes      | Array  | The array of shapes that the part handler can push new shapes to.
 * scope       | object | The scope.
 */
var PartHandlerDispatch = {
  feature: 'content',
  service: 'shape-handler',
  /**
   * Calls part handlers for each part on `context.content.shape`.
   * @param {object} context The context object.
   * @param {object} context.shape The shape to handle. It has the content item for which the parts will be dispatched on its `temp.item`.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleShapePart(context, done) {
    var content = context.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp) {done(); return;}
    var temp = content.temp;
    var item = temp.item;
    var scope = context.scope;
    var contentManager = scope.require('content-manager');
    var partNames = contentManager.getPartNames(item);
    async.each(partNames, function (partName, next) {
      var partType = contentManager.getPartType(item, partName);
      if (!partType || !item[partName]) {next(); return;}
      scope.callService(partType + '-part-handler', 'handle', {
        part: item[partName],
        partName: partName,
        displayType: temp.displayType,
        item: item,
        shapes: temp.shapes,
        scope: scope
      }, next);
    }, done);
  }
};

module.exports = PartHandlerDispatch;