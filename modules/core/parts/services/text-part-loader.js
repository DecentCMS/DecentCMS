// DecentCMS (c) 2018 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var htmlencode = require('htmlencode');

/**
 * The text part loader transforms all flavors of text to HTML.
 */
var TextPartLoader = {
  feature: 'core-parts',
  service: 'text-part-loader',
  /**
   * Prepares the HTML corresponding to a text part.
   * @param {object} context The context object.
   * @param {object} context.part The text part to handle.
   * @param {string} context.partName The name of the part.
   * @param {string} context.partType The type name of the part.
   * @param {object} context.item A reference to the content item.
   * @param {object} context.itemType The type definition for the content item.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  load: function loadTextPart(context, done) {
    if (typeof(context.part) !== 'object') context.part = context.item[context.partName] = {text: context.part};
    var text = '' + (context.part.text || '');
    var flavor = context.part.flavor || context.itemType.parts[context.partName].flavor || 'plain-text';
    var html = null;
    switch(flavor) {
      case 'plain-text':
        html = htmlencode
          .htmlEncode(text)
          .replace('&#13;&#10;', '<br/>\r\n');
        break;
      case 'html':
        html = text;
        break;
      default:
        var flavorHandlers = context.scope.getServices('text-flavor');
        for (var i = 0; i < flavorHandlers.length; i++) {
          if (flavorHandlers[i].matches(flavor)) {
            html = flavorHandlers[i].getHtml(text);
            break;
          }
        }
    }
    context.part.html = html;
    done();
  }
};

module.exports = TextPartLoader;