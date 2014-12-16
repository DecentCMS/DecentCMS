// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var async = require('async');

/**
 * @description
 * The zone handler will render the child shapes found under
 * temp.items and temp.zones of any shape (not just zones).
 */
var ZoneHandler = {
  feature: 'zone-handler',
  service: 'content-handler',
  handleItem: function handleZone(context, done) {
    var request = context.scope;
    var zone = context.shape;
    if (!zone.temp) return;

    var items = zone.temp.items || [];
    async.each(
      items,
      function(item, next) {
        request.callService('content-handler', 'handleItem', {
          scope: request,
          shape: item,
          renderStream: context.renderStream
        }, next);
      },
      function(err) {
        if (err) return done(err);
        var zones = zone.temp.zones || {};
        async.each(
          Object.getOwnPropertyNames(zones),
          function(zoneName, next) {
            var zone = zones[zoneName];
            request.callService('content-handler', 'handleItem', {
              scope: request,
              shape: zone,
              renderStream: context.renderStream
            }, next);
          },
          function(err) {
            return done(err);
          }
        );
      }
    );
  }
};

module.exports = ZoneHandler;