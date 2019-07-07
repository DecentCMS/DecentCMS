// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
// TODO: move all temp stuff into meta, get rid of temp
/**
 * @description
 * An API to manipulate shapes.
 *
 * @param shell
 * @constructor
 */
var Shape = {
  feature: 'shape',
  scope: 'shell',
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
  place: function placeShape(root, path, shape, order) {
    if (path === '-') return;
    path = Array.isArray(path) ? path : path.split('/');
    var rootTemp = this.temp(root);
    if (path.length > 0) {
      if (!rootTemp.items) rootTemp.items = [];
      for (var i = 0; i < path.length; i++) {
        if (!root.zones) root.zones = {};
        var next = root.zones[path[i]];
        if (!next) {
          next = root.zones[path[i]] = {
            meta: {
              type: 'zone',
              name: path[i]
            },
            temp: {
              parent: root,
              items: [],
              zones: {}
            }
          };
        }
        root = next;
        rootTemp = this.temp(root);
      }
    }
    this.insert(rootTemp.items, shape, order);
    this.temp(shape).parent = root;
  },
  /**
   * @description
   * Gets or creates the meta object for a shape.
   * @param {object} shape The shape.
   * @returns {object} The meta object for the shape.
   */
  meta: function shapeMeta(shape) {
    return shape.meta ? shape.meta : shape.meta = {};
  },
  alternates: function shapeAlternates(shape) {
    var meta = Shape.meta(shape);
    return meta.alternates ? meta.alternates : meta.alternates = [];
  },
  /**
   * @description
   * Gets or creates the temporary storage object for a shape.
   * This is an object that can be used for temporary storage
   * of data that should not be persisted.
   * @param {object} shape The shape.
   * @returns {object} The temp object for the shape.
   */
  temp: function shapeTemp(shape) {
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
  parseOrder: function parseOrder(orderString) {
    if (!orderString) return [];
    return (''+ orderString)
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
  insert: function insertShape(shapes, shape, order) {
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
  },

  /**
   * Makes a deep clone of a shape, skipping temp properties throughout the tree.
   * Circular references are skipped.
   * @param {object} shape The shape to clone.
   * @returns {object} The clone of hte shape.
   */
  copy: function copyShape(shape) {
    var known = arguments.length > 1 ? arguments[1] : new Set();
    if (typeof(shape) !== 'object') return shape;
    if (shape instanceof Date) {
      return shape.toISOString();
    }
    if (Array.isArray(shape)) {
      var arrayResult = [];
      shape.forEach(function(item, i) {
        arrayResult[i] = Shape.copy(item, known);
      });
      return arrayResult;
    }
    // This is a non-array object
    known.add(shape);
    var result = {};
    for (var subName of Object.getOwnPropertyNames(shape)) {
      if (subName !== 'temp') {
        var sub = shape[subName];
        if (sub && !known.has(sub)) {
          result[subName] = Shape.copy(sub, known);
        }
      }
    }
    return result;
  }
};

module.exports = Shape;