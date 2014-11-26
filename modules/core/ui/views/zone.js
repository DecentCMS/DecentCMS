// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function zoneTemplate(zone, renderer) {
  if (!zone.meta || zone.meta.type !== 'zone' || !zone.temp) return;
  var items = zone.temp.items;
  if (items && Array.isArray(items)) {
    for (var i = 0; i < items.length; i++) {
      renderer.shape(items[i]);
    }
  }
  var zones = zone.temp.zones;
  if (zones) {
    for (var zoneName in zones) {
      renderer.shape(zones[zoneName]);
    }
  }
}

module.exports = zoneTemplate;