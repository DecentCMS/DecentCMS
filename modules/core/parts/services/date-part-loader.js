// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * The date part loader parses date strings into real date objects.
 */
var DatePartLoader = {
  feature: 'core-parts',
  service: 'date-part-loader',
  /**
   * Parses date strings into real dates.
   * @param {object} context The context object.
   * @param {object} context.part The date part to handle.
   * @param {string} context.partName The name of the part.
   * @param {string} context.partType The type name of the part.
   * @param {object} context.item A reference to the content item.
   * @param {object} context.itemType The type definition for the content item.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  load: function loadDatePart(context, done) {
    var part = context.part.date || context.part;
    var date = part instanceof Date
      ? part : typeof(part) === 'string'
      ? new Date(Date.parse(part)) : null;
    var locale = part.locale || (part.meta ? part.meta.locale : null) || 'en-US';
    var options = part.options || {};
    context.item[context.partName] = {
      meta: {
        type: 'date',
        name: context.partName
      },
      temp: {
        item: context.item
      },
      locale: locale,
      options: options,
      date: date
    };
    done();
  }
};

module.exports = DatePartLoader;