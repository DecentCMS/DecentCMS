// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function ZoneHandler(shell, options) {
  this.shell = shell;
  this.item = options.item;
}

ZoneHandler.on = {
  'decent.core.handle-item': function(shell, options) {
    var zone = options.shape;
    if (!zone.meta || !zone.temp) return;

    var items = zone.temp.items;
    if (items) {
      for (var i = 0; i < items.length; i++) {
        shell.emit('decent.core.handle-item', {
          shape: items[i],
          renderStream: options.renderStream
        });
      }
    }
    var zones = zone.temp.zones;
    if (zones) {
      for (var zoneName in zones) {
        shell.emit('decent.core.handle-item', {
          shape: zones[zoneName],
          renderStream: options.renderStream
        });
      }
    }
  }
};

module.exports = ZoneHandler;