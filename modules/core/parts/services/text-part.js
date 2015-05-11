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
  service: 'shape-handler',
  /**
   * Adds a text shape to `context.shape.temp.shapes` for each text
   * part on the content item.
   * @param {object} context The context object.
   * @param {object} context.shape The shape to handle. Its `temp.item` is a reference to the content item.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleTextPart(context, done) {
    var content = context.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp) return done();
    var temp = content.temp;
    var item = temp.item;
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
      var flavor = part.flavor
        || (part.src ? path.extname(part.src).substr(1) : 'plain-text');
      if (temp.shapes) {
        temp.shapes.push({
          meta: {
            type: 'text',
            name: partName,
            alternates: ['text-' + partName],
            item: item
          },
          temp: {displayType: temp.displayType},
          text: text,
          flavor: flavor
        });
      }
    }
    done();
  }
};

module.exports = TextPart;