// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: add support for part name matches

/**
 * @description
 * Uses placement.js and placement.json files found at the
 * root of modules to dispatch shapes into.
 * The placement.js files should export a function(scope, rootShape, shapes)
 * that should splice shapes out of the shapes array if and when it decides
 * to place them on the rootShape.
 * The placement.json files contain an object that may have one "matches"
 * property that contains an array of objects that must expose a path and
 * an order property. They can have any combination of id, type, and
 * displayType regular expressions that shapes will be matched against.
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
            var shapeTypeExpression = match.type ? new RegExp(match.type) : null;
            var displayTypeExpression = match.displayType ? new RegExp(match.displayType) : null;
            var path = match.path;
            var order = match.order;

            placementHandlers.push(function (scope, rootShape, shapes) {
              for (var k = 0; k < shapes.length; k++) {
                var shapeToPlace = shapes[k];
                if (idExpression
                  && (!shapeToPlace.id || !idExpression.test(shapeToPlace.id))) {
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

FilePlacementStrategy.prototype.placeShapes = function filePlace(payload, done) {
  var rootShape = payload.shape;
  var shapes = payload.shapes;
  if (!shapes) return;
  var shapeHelper = this.scope.require('shape');
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