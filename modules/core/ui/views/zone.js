// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function(zone, shell) {
  var items = zone.items;
  if (items && Array.isArray(items)) {
    for (var i = 0; i < items.length; i++) {
      shell.emit('decent.core.shape.render', items[i]);
    }
    var shapeHelper = shell.require('shape');
    return items
      .map(function(item) {return shapeHelper.temp(item).html || '';})
      .join('\n');
  }
  return '';
};