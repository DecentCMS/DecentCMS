// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * Gets the widget layers from the site's widget/index.json
 * file.
 */
function FileLayerStore(scope) {
  this.scope = scope;
}
FileLayerStore.scope = 'shell';
FileLayerStore.isScopeSingleton = true;
FileLayerStore.service = 'layer-store';
FileLayerStore.feature = 'file-layer-store';

/**
 * Adds layers to the current context's layers property.
 * @param {object} [context.layers] The existing set of layers.
 * @param {object} layers The new layers to add.
 * @param {function} next The next function in the call chain.
 */
function setLayers(context, layers, next) {
  if (!context.layers) {
    context.layers = layers;
  }
  else {
    Object.getOwnPropertyNames(layers).forEach(function (layerName) {
      context.layers[layerName] = layers[layerName];
    });
  }
  next();
}

/**
 * @description
 * Loads layers from the site's widget/index.json.
 * @param {object} [context.layers] Existing layers, to which the method will add.
 * @param {function} next The next function in the call chain, called when the layers have been read.
 */
FileLayerStore.prototype.loadLayers = function loadLayersFromFile(context, next) {
  var path = require('path');
  var fs = require('fs');

  if (this.layers) {
    setLayers(context, this.layers, next);
    return;
  }
  var siteLayerPath = path.join(this.scope.rootPath, 'widget', 'index.json');
  fs.readFile(siteLayerPath, function(err, layerJson) {
    if (err) return next(err);
    var layers = JSON.parse(layerJson);
    setLayers(context, layers, next);
  });
};

module.exports = FileLayerStore;