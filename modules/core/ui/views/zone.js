// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var async = require('async');

function zoneTemplate(zone, renderer, done) {
  if (!zone.meta || zone.meta.type !== 'zone' || !zone.temp) return;
  var items = zone.temp.items;
  async.eachSeries(
    Array.isArray(items) ? items : [],
    function(item, next) {
      renderer
        .shape({shape: item})
        .finally(next);
    },
    function() {
      var zones = zone.temp.zones;
      async.eachSeries(
        Object.getOwnPropertyNames(zones || {}),
        function(zoneName, next) {
          renderer
            .shape({shape: zones[zoneName]})
            .finally(next);
        },
        function() {
          done();
        }
      );
    });
}

module.exports = zoneTemplate;