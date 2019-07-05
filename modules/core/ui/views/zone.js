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
    }, done);
}

module.exports = zoneTemplate;