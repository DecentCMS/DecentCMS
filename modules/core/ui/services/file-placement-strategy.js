// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: add support for part name matches

/**
 * @description
 * Uses placement.js and placement.json files found at the
 * root of modules to dispatch shapes into.
 *
 * The placement.js files should export a function(scope, rootShape, shapes)
 * that should splice shapes out of the shapes array if and when it decides
 * to place them on the rootShape.
 *
 * The placement.json files contain an object that may have one "matches"
 * property that contains an array of objects that must expose a path and
 * an order property. They can have any combination of id, type, and
 * displayType regular expressions that shapes will be matched against.
 *
 * Besides the matches array, the top object in the placement.json file
 * can have properties whose names are shape types, that have a path and
 * an order properties.
 * @constructor
 */
function FilePlacementStrategy(scope) {
  this.scope = scope;
  var shapeHelper = scope.require('shape');
  var placement = this.placement = {};
  var placementHandlers = this.placementHandlers = [];
  var fileResolution = scope.require('file-resolution');
  var placementFiles = fileResolution.all(/placement\.(json|js)/);
  placementFiles.reverse();
  for (var i = 0; i < placementFiles.length; i++) {
    var placementObject = require(placementFiles[i]);
    if (placementFiles[i].substr(-3) === '.js') {
      placementHandlers.push(placementObject);
    }
    else {
      for (var shape in placementObject) {
        if (shape === 'matches') {
          placementObject.matches.forEach(function forEachMatch(match) {
            var idExpression = match.id ? new RegExp(match.id) : null;
            var nameExpression = match.name ? new RegExp(match.name) : null;
            var shapeTypeExpression = match.type ? new RegExp(match.type) : null;
            var displayTypeExpression = match.displayType ? new RegExp(match.displayType) : null;
            // Find other custom match properties
            var customMatchExpressions = [];
            Object.getOwnPropertyNames(match).forEach(function(propertyName) {
              if (['path', 'order', 'id', 'name', 'type', 'displayType'].indexOf(propertyName) === -1) {
                customMatchExpressions.push({
                  propertyPath: propertyName.split('.'),
                  expression: new RegExp(match[propertyName])
                });
              }
            });
            var path = match.path;
            var order = match.order;

            placementHandlers.push(function (scope, rootShape, shapes) {
              for (var k = 0; k < shapes.length; k++) {
                var shapeToPlace = shapes[k];
                if (idExpression
                  && (!shapeToPlace.id || !idExpression.test(shapeToPlace.id))) {
                  continue;
                }
                if (nameExpression
                  && (!shapeToPlace.meta || !shapeToPlace.meta.name
                  || !nameExpression.test(shapeToPlace.meta.name))) {
                  continue;
                }
                if (shapeTypeExpression
                  && (!shapeToPlace.meta
                  || !shapeToPlace.meta.type
                  || !shapeTypeExpression.test(shapeToPlace.meta.type))) {
                  continue;
                }
                if (displayTypeExpression
                  && (!shapeToPlace.temp
                  || !shapeToPlace.temp.displayType
                  || !displayTypeExpression.test(shapeToPlace.temp.displayType))) {
                  continue;
                }
                // If any custom match
                var customMatch = true;
                for (var l = 0; l < customMatchExpressions.length; l++) {
                  var customMatchExpression = customMatchExpressions[l];
                  var propertyPath = customMatchExpression.propertyPath;
                  var obj = shapeToPlace;
                  for (var m = 0; m < propertyPath.length; m++) {
                    obj = obj[propertyPath[m]];
                    if (!obj) break;
                  }
                  if (!obj || !customMatchExpression.expression.test(obj)) {
                    customMatch = false;
                    break;
                  }
                }
                if (!customMatch) continue;
                // We have a match. Place the shape, and remove it from the list.
                shapeHelper.place(rootShape, path, shapeToPlace, order);
                shapes.splice(k--, 1);
              }
            });
          });
        }
        else {
          placement[shape] = placementObject[shape];
        }
      }
    }
  }
}
FilePlacementStrategy.service = 'placement-strategy';
FilePlacementStrategy.scope = 'shell';
FilePlacementStrategy.isScopeSingleton = true;
FilePlacementStrategy.feature = 'file-placement-strategy';
FilePlacementStrategy.dependencies = ['decent-core-io'];

/**
 * Dispatches a list of shapes under a root shape, by handing over the task
 * to the placement strategies discovered by the constructor.
 * @param {object} context The context.
 * @param {object} context.shape
 * The root shape under which the shapes must be placed.
 * @param {Array} context.shapes
 * The list of shapes that must be placed.
 * @param {Function} done The callback.
 */
FilePlacementStrategy.prototype.placeShapes = function filePlace(context, done) {
  var rootShape = context.shape;
  var shapes = context.shapes;
  if (!shapes) return;
  var shapeHelper = this.scope.require('shape');
  // If shapes have placement built-in, use that.
  for (i = 0; i < shapes.length; i++) {
    var shape = shapes[i];
    if (shape.meta && shape.meta.placement) {
      var placement = shape.meta.placement;
      if (typeof(placement) === 'string') {
        var splitPlacement = placement.split(':');
        if (splitPlacement.length === 2) {
          shapeHelper.place(
            rootShape,
            splitPlacement[0] || 'main',
            shape,
            splitPlacement[1] || 'after');
          shapes.splice(i--, 1);
        }
      }
      else {
        shapeHelper.place(
          rootShape,
          placement.path || 'main',
          shape,
          placement.order || 'after');
        shapes.splice(i--, 1);
      }
    }
  }
  // Handlers have the priority on placing shapes
  for (var i = 0; i < this.placementHandlers.length; i++) {
    this.placementHandlers[i](this.scope, rootShape, shapes);
  }
  for (i = 0; i < shapes.length; i++) {
    var shape = shapes[i];
    if (shape.meta && shape.meta.type && this.placement[shape.meta.type]) {
      var placementItem = this.placement[shape.meta.type];
      shapeHelper.place(rootShape, placementItem.path, shape, placementItem.order);
      shapes.splice(i--, 1);
    }
  }
  done();
};

module.exports = FilePlacementStrategy;