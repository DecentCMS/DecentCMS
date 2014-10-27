// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');

/**
 * The text part handler creates text shapes. The flavor
 * of the text can be inferred from the extension on a path
 * property on the part if it exist.
 * @param shell
 * @constructor
 */
var TextPart = {
  feature: 'core-parts',
  on: {
    'decent.core.handle-item': function(shell, options) {
      var content = options.shape;
      if (!content.meta
        || content.meta.type !== 'content'
        || !content.temp) return;
      var temp = content.temp;
      var item = temp.item;
      var renderer = options.renderStream;
      var contentManager = renderer.contentManager;
      var textParts = contentManager.getParts(item, 'text');
      for (var i = 0; i < textParts.length; i++) {
        var partName = textParts[i];
        var part = item[partName];
        var text = part.text;
        if (!text && part._data) {
          text = part._data;
        }
        var flavor = part.flavor
          || (part.path ? path.extname(part.path).substr(1) : 'plain-text');
        temp.shapes.push({
          meta: {type: 'text', name: partName},
          temp: {displayType: temp.displayType},
          text: text,
          flavor: flavor
        });
      }
    }
  }
};

module.exports = TextPart;