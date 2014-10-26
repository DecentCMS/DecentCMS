// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * An API to manipulate shapes.
 *
 * @param shell
 * @constructor
 */
var Shape = {
  /**
   * @description
   * Places a shape into the shape tree above a root shape.
   * If shapes along the path don't exist, they are created
   * as anonymous shapes (in other words, zones).
   *
   * @param {object} root  The root shape.
   * @param {string} path  The '/'-separated path where the shape
   *                       must be added.
   * @param {object} shape The shape to add.
   * @param {string} order The dotted order string describing
   *                       where the shape will be added on the
   *                       last part of the path.
   */
  place: function (root, path, shape, order) {
    if (path === '-') return;
    path = Array.isArray(path) ? path : path.split('/');
    var tempRoot = this.temp(root);
    if (!tempRoot.items) {
      tempRoot.items = [];
    }
    if (!tempRoot.zones) {
      tempRoot.zones = {};
    }
    if (path.length > 0) {
      for (var i = 0; i < path.length; i++) {
        var next = root[path[i]];
        if (!next) {
          next = root[path[i]] = {
            meta: {type: 'zone'},
            temp: {
              parent: root,
              items: [],
              zones: {}
            }
          };
        }
        tempRoot.zones[path[i]] = next;
        root = next;
        tempRoot = this.temp(root);
      }
    }
    this.insert(tempRoot.items, shape, order);
    this.temp(shape).parent = root;
  },
  /**
   * @description
   * Gets or creates the meta object for a shape.
   * @param {object} shape The shape.
   * @returns {object} The meta object for the shape.
   */
  meta: function (shape) {
    return shape.meta ? shape.meta : shape.meta = {};
  },
  /**
   * @description
   * Gets or creates the temporary storage object for a shape.
   * This is an object that can be used for temporary storage
   * of data that should not be persisted.
   * @param {object} shape The shape.
   * @returns {object} The temp object for the shape.
   */
  temp: function (shape) {
    return shape.temp ? shape.temp : shape.temp = {};
  },
  /**
   * @description
   * Parses a dotted path into an array of orders.
   * For example: "1.42.after.1" -> [1, 42, 'after', 1]
   *
   * @param {string} orderString The order string to parse.
   * @returns {Array} The parsed array of orders.
   */
  parseOrder: function (orderString) {
    if (!orderString) return [];
    return orderString
      .split('.')
      .map(function (token) {
        var numberToken = parseInt(token, 10);
        return isNaN(numberToken) ? token : numberToken;
      });
  },
  /**
   * @description
   * Inserts a shape into an array of shapes at the specified order.
   * As a side effect, the parsed order is added as shape.meta.order.
   *
   * @param {Array} shapes The array of shapes where the shape must be inserted.
   * @param {object} shape The shape to insert.
   * @param {string=} order The order string.
   */
  insert: function (shapes, shape, order) {
    var meta = this.meta(shape);
    var parsedOrder = meta.order = this.parseOrder(order);
    for (var i = 0; i < shapes.length; i++) {
      var otherShape = shapes[i];
      var otherOrder = this.meta(otherShape).order;
      for (var j = 0; j < otherOrder.length; j++) {
        // If we won't find a higher token at this level
        // because the current one is 'higher', or we
        // haven't found a higher token and we're out of
        // tokens, look at the next shape.
        if (j >= parsedOrder.length || parsedOrder[j] === 'after') break;

        var token = parsedOrder[j];
        var otherToken = otherOrder[j];
        // If the other token is 'before', we can't be before it, so next,
        // unless we are before as well.
        if (otherToken === 'before' && token !== 'before') continue;

        // If the other token is before ours, we can go to the next
        if (token > otherToken) break;
        // If the other token goes after our token, time to insert.
        if (token === 'before'
          || (otherToken === 'after' && token !== 'after')
          || token < otherToken) {
          shapes.splice(i, 0, shape);
          return;
        }
      }
    }
    // Didn't find anything that should go after ours, so add to the end.
    shapes.push(shape);
  }
};

module.exports = Shape;