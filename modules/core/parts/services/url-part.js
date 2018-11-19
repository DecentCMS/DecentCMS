// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');

/**
 * The URL part handler creates url shapes.
 */
var UrlPart = {
  feature: 'core-parts',
  service: 'url-part-handler',
  /**
   * Adds a url shape to `context.shapes` for the URL part on the context.
   * @param {object} context The context object.
   * @param {object} context.part The text part to handle.
   * @param {string} context.partName The name of the part.
   * @param {string} context.displayType The display type.
   * @param {object} context.item A reference to the content item.
   * @param {Array} context.shapes The shapes array to which new shapes must be pushed.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleUrlPart(context, done) {
    var shapes = context.shapes;
    if (!shapes) {done();return;}
    var part = context.part;
    var url = typeof(part) === 'string'
      ? part
      : part.url;
    var text = part.text || url;
    shapes.push({
      meta: {
        type: 'url',
        name: context.partName,
        alternates: ['url-' + context.partName]
      },
      temp: {
        displayType: context.displayType,
        item: context.item
      },
      text: text,
      url: url
    });
    done();
  }
};

module.exports = UrlPart;