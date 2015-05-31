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
  service: 'text-part-handler',
  /**
   * Adds a text shape to `context.shapes` for the text part on the context.
   * @param {object} context The context object.
   * @param {object} context.part The text part to handle.
   * @param {string} context.partName The name of the part.
   * @param {string} context.displayType The display type.
   * @param {object} context.item A reference to the content item.
   * @param {Array} context.shapes The shapes array to which new shapes must be pushed.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleTextPart(context, done) {
    var shapes = context.shapes;
    if (!shapes) {done();return;}
    var part = context.part;
    var text = typeof(part) === 'string'
      ? part
      : part.text;
    var flavor = part.flavor
      || (part.src ? path.extname(part.src).substr(1) : 'plain-text');
    shapes.push({
      meta: {
        type: 'text',
        name: context.partName,
        alternates: ['text-' + context.partName],
        item: context.item
      },
      temp: {displayType: context.displayType},
      text: text,
      flavor: flavor
    });
    done();
  }
};

module.exports = TextPart;