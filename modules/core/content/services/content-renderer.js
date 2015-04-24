// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * The ContentRenderer is responsible for the content item rendering lifecycle.
 */
function ContentRenderer(scope) {
  this.scope = scope;
  scope.shapes = scope.shapes || [];
}
ContentRenderer.feature = 'content';
ContentRenderer.service = 'renderer';
ContentRenderer.scope = 'request';
ContentRenderer.isScopeSingleton = true;

/**
 * @description
 * Adds a shape or a content item to the list of shapes for the request.
 * @param options
 * @param {string} [options.id]
 * The id of an item to fetch and add as a shape.
 * @param {object} [options.shape]
 * A shape to add to the list of shapes to render.
 * @param {string} [options.displayType]
 * The display type to use when rendering the shape.
 */
ContentRenderer.prototype.promiseToRender = function promiseToRender(options) {
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
 * @param context
 * @param {object}          [context.scope] The scope, which is normally the current request.
 * @param {IncomingMessage} [context.request] The request.
 * @param {ServerResponse}  [context.response] The response.
 * @param {Function} pageBuilt The function to call when the page has been rendered.
 */
ContentRenderer.prototype.render = function render(context, pageBuilt) {
  var scope = this.scope;
  if (scope.handled) {
    pageBuilt();
    return;
  }
  var log = scope.require('log');
  var response = context.response;
  var shapes = scope.shapes;
  var layout = scope.layout = {
    meta: {type: 'layout'},
    site: scope.require('shell'),
    temp: {}
  };
  var renderStream = scope.require('render-stream');
  // TODO: add filters, that are just additional pipes before res.
  renderStream
    .on('data', function(data) {
      response.write(data);
    });
  if (renderStream.onError) {
    renderStream.onError(function (err) {
      pageBuilt(err);
      return;
    });
  }
  if (scope.itemId) {
    var item = scope.require('storage-manager').getAvailableItem(scope.itemId);
    if (item) {
      layout.temp.item = item;
    }
    else {
      response.statusCode = 404;
      renderStream.title = scope.title = layout.title =
        scope.require('localization')('404 - Not Found');
      scope.require('shape')
        .place(layout, 'main', {
          meta: {type: 'not-found'},
          notFoundId: scope.itemId
        }, 'before');
    }
  }
  var lifecycle = scope.lifecycle(
    // Build the shape tree through placement strategies
    'placement-strategy', 'placeShapes',
    // Let handlers manipulate items and shapes
    // Handlers are responsible for drilling into the tree according to
    // their knowledge of the shapes they are handling.
    'shape-handler', 'handle',
    // Call for meta, script, and style sheet registration
    function registerMetaStyleAndScript(options, done) {
      scope.emit(ContentRenderer.registerMetaEvent, {renderStream: renderStream});
      scope.emit(ContentRenderer.registerStyleEvent, {renderStream: renderStream});
      scope.emit(ContentRenderer.registerScriptEvent, {renderStream: renderStream});
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
    if (err) {
      log.error('Error during content rendering', err);
      pageBuilt(err);
      return;
    }
    // Tear down
    renderStream.end();
    pageBuilt();
  });
};

/**
 * Calls for meta tag registering.
 */
ContentRenderer.registerMetaEvent = 'decent.core.register-meta';
ContentRenderer.registerMetaEvent_payload = {
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

/**
 * Calls for style sheet registering.
 */
ContentRenderer.registerStyleEvent = 'decent.core.register-style';
ContentRenderer.registerStyleEvent_payload = {
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

/**
 * Calls for script registering.
 */
ContentRenderer.registerScriptEvent = 'decent.core.register-script';
ContentRenderer.registerScriptEvent_payload = {
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

module.exports = ContentRenderer;