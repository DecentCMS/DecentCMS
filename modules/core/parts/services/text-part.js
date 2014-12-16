// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');

/**
 * The text part handler creates text shapes. The flavor
 * of the text can be inferred from the extension on a path
 * property on the part if it exist.
 */
var TextPart = {
  feature: 'core-parts',
  service: 'content-handler',
  handleItem: function handleTextPart(context, done) {
    var content = context.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp) return done();
    var temp = content.temp;
    var item = temp.item;
    var renderer = context.renderStream;
    var scope = context.scope;
    var contentManager = scope.require('content-manager');
    var textParts = contentManager.getParts(item, 'text');
    for (var i = 0; i < textParts.length; i++) {
      var partName = textParts[i];
      var part = item[partName];
      if (!part) continue;
      var text = typeof(part) === 'string'
        ? part
        : part.text;
      if (!text && part._data) {
        text = part._data;
      }
      var flavor = part.flavor
        || (part.src ? path.extname(part.src).substr(1) : 'plain-text');
      temp.shapes.push({
        meta: {type: 'text', name: partName},
        temp: {displayType: temp.displayType},
        text: text,
        flavor: flavor
      });
    }
    done();
  }
};

module.exports = TextPart;