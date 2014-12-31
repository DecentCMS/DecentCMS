// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var async = require('async');

/**
 * @description
 * The ContentStorageManager is responsible for the content retrieval and rendering lifecycle.
 */
function ContentStorageManager(scope) {
  this.scope = scope;
  scope.shapes = scope.shapes || [];
}
ContentStorageManager.feature = 'content';
ContentStorageManager.service = 'renderer';
ContentStorageManager.scope = 'request';
ContentStorageManager.isScopeSingleton = true;

/**
 * @description
 * Adds a shape or a content item to the list of shapes for the request.
 * @param options
 * @param {string} [options.id]          The id of an item to fetch and add
 *                                       as a shape.
 * @param {object} [options.shape]       A shape to add to the list of shapes
 *                                       to render.
 * @param {string} [options.displayType] The display type to use when
 * rendering the shape.
 */
ContentStorageManager.prototype.promiseToRender = function promiseToRender(options) {
  var scope = this.scope;
  if (!scope.shapes) {
    scope.shapes = [];
  }
  if (options.id) {
    scope.require('storage-manager').promiseToGet(options.id);
    if (options.displayType === 'main') {
      scope.itemId = options.id;
    }
    scope.shapes.push({
      meta: {
        type: 'shape-item-promise',
        place: options.place
      },
      temp: {
        displayType: options.displayType || 'details'
      },
      id: options.id
    });
  }
  else if (options.shape) {
    scope.shapes.push(options.shape);
  }
};

/**
 * @description
 * Builds the rendered page from the list of shapes that was prepared
 * so far. This method defines the rendering lifecycle, by emitting
 * events and service calls:
 * * 'placement-strategy'.placeShapes({shape, shapes, renderStream}, done)
 * * 'shape-handler'.handle({shape, shapes, renderStream}, done)
 * * decent.core.register-meta
 * * decent.core.register-style
 * * decent.core.register-script
 * * 'rendering-strategy'.render({shape, shapes, renderStream}, done)
 * @param payload
 * @param {object}          [payload.scope] The scope, which is normally the current request.
 * @param {IncomingMessage} [payload.request] The request.
 * @param {ServerResponse}  [payload.response] The response.
 * @param {Function} pageBuilt The function to call when the page has been rendered.
 */
ContentStorageManager.prototype.render = function render(payload, pageBuilt) {
  // TODO: rename payload to context everywhere.
  var scope = this.scope;
  var response = payload.response;
  var shapes = scope.shapes;
  var layout = scope.layout = {
    meta: {type: 'layout'},
    site: scope.require('shell')
  };
  if (scope.itemId) {
    var item = scope.require('storage-manager').getAvailableItem(scope.itemId);
    if (!item) {
      response.statusCode = 404;
      scope.require('shape')
        .place(layout, 'main', {
          meta: {type: 'not-found'},
          notFoundId: scope.itemId
        }, 'before');
    }
  }
  var renderStream = scope.require('render-stream');
  // TODO: add filters, that are just additional pipes before res.
  renderStream
    .on('data', function(data) {
      response.write(data);
    })
    .onError(function(err) {
      pageBuilt(err);
    });
  var lifecycle = scope.lifecycle(
    // Build the shape tree through placement strategies
    'placement-strategy', 'placeShapes',
    // Let handlers manipulate items and shapes
    // Handlers are responsible for drilling into the tree according to
    // their knowledge of the shapes they are handling.
    'shape-handler', 'handle',
    // Call for meta, script, and style sheet registration
    function registerMetaStyleAndScript(options, done) {
      scope.emit(ContentStorageManager.registerMetaEvent, {renderStream: renderStream});
      scope.emit(ContentStorageManager.registerStyleEvent, {renderStream: renderStream});
      scope.emit(ContentStorageManager.registerScriptEvent, {renderStream: renderStream});
      done();
    },
    // Render
    'rendering-strategy', 'render'
  );
  lifecycle({
    scope: scope,
    shape: layout,
    shapes: shapes,
    renderStream: renderStream
  }, function contentRenderingDone(err) {
    // Tear down
    renderStream.end();
    pageBuilt(err);
  });
};

/**
 * Calls for meta tag registering.
 */
ContentStorageManager.registerMetaEvent = 'decent.core.register-meta';
ContentStorageManager.registerMetaEvent.payload = {
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

/**
 * Calls for style sheet registering.
 */
ContentStorageManager.registerStyleEvent = 'decent.core.register-style';
ContentStorageManager.registerStyleEvent.payload = {
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

/**
 * Calls for script registering.
 */
ContentStorageManager.registerScriptEvent = 'decent.core.register-script';
ContentStorageManager.registerScriptEvent.payload = {
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

module.exports = ContentStorageManager;