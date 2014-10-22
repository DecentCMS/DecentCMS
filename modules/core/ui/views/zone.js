// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function zoneTemplate(zone, renderer, shell) {
  if (!zone.meta || zone.meta.type !== 'zone' || !zone.temp) return;
  var items = zone.temp.items;
  if (items && Array.isArray(items)) {
    for (var i = 0; i < items.length; i++) {
      shell.emit('decent.core.shape.render', {
        shape: items[i],
        renderStream: renderer
      });
      renderer.write('\n');
    }
  }
  var zones = zone.temp.zones;
  if (zones) {
    for (var zoneName in zones) {
      shell.emit('decent.core.shape.render', {
        shape: zones[zoneName],
        renderStream: renderer
      });
      renderer.write('\n');
    }
  }
};