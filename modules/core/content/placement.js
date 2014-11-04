// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// By default, display type main goes to the main zone.
module.exports = function(shell, rootShape, shapes) {
  var shapeHelper = shell.require('shape');
  if (!shapes) return;
  for (var i = 0; i < shapes.length; i++) {
    var shape = shapes[i];
    var temp = shapeHelper.temp(shape);
    var meta = shapeHelper.meta(shape)
    if (meta.type === 'shape-item-promise' && temp.displayType === 'main') {
      shapeHelper.place(rootShape, 'main', shape, 'after');
      shapes.splice(i--, 1);
    }
  }
};