// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');

/**
 * The URL part handler creates url shapes.
 */
var UrlPart = {
  feature: 'core-parts',
  service: 'shape-handler',
  handle: function handleUrlPart(context, done) {
    var content = context.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp) return done();
    var temp = content.temp;
    var item = temp.item;
    var scope = context.scope;
    var contentManager = scope.require('content-manager');
    var urlParts = contentManager.getParts(item, 'url');
    for (var i = 0; i < urlParts.length; i++) {
      var partName = urlParts[i];
      var part = item[partName];
      if (!part) continue;
      var url = typeof(part) === 'string'
        ? part
        : part.url;
      var text = part.text || url;
      temp.shapes.push({
        meta: {
          type: 'url',
          name: partName,
          alternates: ['url-' + partName],
          item: item
        },
        temp: {displayType: temp.displayType},
        text: text,
        url: url
      });
    }
    done();
  }
};

module.exports = UrlPart;