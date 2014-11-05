// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function zoneTemplate(zone, renderer, scope) {
  if (!zone.meta || zone.meta.type !== 'zone' || !zone.temp) return;
  var items = zone.temp.items;
  if (items && Array.isArray(items)) {
    for (var i = 0; i < items.length; i++) {
      scope.emit('decent.core.shape.render', {
        shape: items[i],
        renderStream: renderer
      });
      renderer.writeLine();
    }
  }
  var zones = zone.temp.zones;
  if (zones) {
    for (var zoneName in zones) {
      scope.emit('decent.core.shape.render', {
        shape: zones[zoneName],
        renderStream: renderer
      });
      renderer.writeLine();
    }
  }
}

module.exports = zoneTemplate;