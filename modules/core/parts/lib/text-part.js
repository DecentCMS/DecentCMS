// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');

function TextPart(shell, options) {
  this.shell = shell;
  this.item = options.item;
}

TextPart.on = {
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
};

module.exports = TextPart;