// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * The zone handler will render the child shapes found
 * under `temp.items` and `temp.zones` of any shape (not just zones).
 */
var ZoneHandler = {
  feature: 'zone-handler',
  service: 'shape-handler',
  /**
   * Handles all shapes that have sub-shapes under `temp.items`
   * or `temp.zones`, and recursively handles those.
   *
   * @param {object} context The context.
   * @param {object} context.scope The scope.
   * @param {object} context.shape The shape.
   * @param {object} context.renderStream The render stream.
   */
  handle: function handleZone(context, done) {
    var request = context.scope;

    var zone = context.shape;
    if (!zone.temp) return;

    var items = zone.temp.items || [];
    var async = require('async');
    async.each(
      items,
      function(item, next) {
        request.callService('shape-handler', 'handle', {
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
            request.callService('shape-handler', 'handle', {
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