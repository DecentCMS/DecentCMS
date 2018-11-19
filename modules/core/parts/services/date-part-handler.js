// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');

/**
 * The date part handler creates date shapes.
 */
var DatePartHandler = {
  feature: 'core-parts',
  service: 'date-part-handler',
  /**
   * Adds a date shape to `context.shapes` for the date part on the context.
   * @param {object} context The context object.
   * @param {object} context.part The date part to handle.
   * @param {string} context.partName The name of the part.
   * @param {string} context.displayType The display type.
   * @param {object} context.item A reference to the content item.
   * @param {Array} context.shapes The shapes array to which new shapes must be pushed.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleDatePart(context, done) {
    var shapes = context.shapes;
    if (!shapes) {done();return;}
    var part = context.part;
    var date = part instanceof Date ? part
      : part.date ?
        part.date instanceof Date ? part.date
        : new Date(Date.parse(part.date))
      : new Date(Date.parse(part));
    var locale = part.locale || (part.meta ? part.meta.locale : null) || 'en-US';
    var options = part.options || {};
    shapes.push({
      meta: {
        type: 'date',
        name: context.partName,
        alternates: ['date-' + context.partName]
      },
      temp: {
        displayType: context.displayType,
        item: context.item
      },
      locale: locale,
      options: options,
      date: date
    });
    done();
  }
};

module.exports = DatePartHandler;