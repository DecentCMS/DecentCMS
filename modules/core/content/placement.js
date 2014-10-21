// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// By default, display type main goes to the content zone.
module.exports = function(shell, rootShape, shapes) {
  var shapeHelper = shell.require('shape');
  for (var i = 0; i < shapes.length; i++) {
    if (shapeHelper.temp(shapes[i]).displayType === 'main') {
      shapeHelper.place(rootShape, 'content', shapes[i], 'after');
      shapes.splice(i--, 1);
    }
  }
};