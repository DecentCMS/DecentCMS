// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function(zone, renderer, shell) {
  var items = zone.items;
  if (items && Array.isArray(items)) {
    for (var i = 0; i < items.length; i++) {
      shell.emit('decent.core.shape.render', {
        shape: items[i],
        renderStream: renderer
      });
      renderer.write('\n');
    }
  }
};