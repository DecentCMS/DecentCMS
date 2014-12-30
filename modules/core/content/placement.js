// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// By default, display type main goes to the main zone.
module.exports = function placeItemPromises(scope, rootShape, shapes) {
  var shapeHelper = scope.require('shape');
  if (!shapes) return;
  for (var i = 0; i < shapes.length; i++) {
    var shape = shapes[i];
    var meta = shapeHelper.meta(shape);
    if (meta.type === 'shape-item-promise') {
      var temp = shapeHelper.temp(shape);
      if (meta.place) {
        var splitPlace = meta.place.split(':');
        shapeHelper.place(rootShape, splitPlace[0], shape, splitPlace[1]);
        shapes.splice(i--, 1);
      }
      else {
        if (temp.displayType === 'main') {
          shapeHelper.place(rootShape, 'main', shape, 'after');
          shapes.splice(i--, 1);
        }
      }
    }
  }
};