// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

//TODO: Separate lifetime features from content management apis

/**
 * @description
 * The ContentManager is responsible for the content retrieval and rendering lifecycle.
 * It also exposes APIs that facilitate the usage of content items, content parts, and
 * content types.
 * @param {object} scope
 * @constructor
 */
function ContentManager(scope) {
  this.scope = scope;
  this.items = {};
  this.itemsToFetch = {};
  this.shapes = [];
}
ContentManager.feature = 'content-manager';
ContentManager.scope = 'shell';
ContentManager.isStatic = true;

ContentManager.on = {
  'decent-core-shell-start-request': function onStartRequest(scope, payload) {
    // Create a content manager for the duration of the request.
    payload.request.contentManager = new ContentManager(scope);
  },
  'decent.core.shell.fetch-content': function onFetchContent(scope, payload) {
    if (!payload.request) return;
    // Find the content manager for the current request
    var contentManager = payload.request.contentManager;
    if (!contentManager) return;
    // Use it to fetch items from the content store
    contentManager.fetchItems(payload);
  },
  'decent.core.shell.render-page': function onRenderPage(scope, payload) {
    if (!payload.request) return;
    // Find the content manager for the current request
    var contentManager = payload.request.contentManager;
    if (!contentManager) return;
    // Use it to build the rendered page
    contentManager.buildRenderedPage(payload);
  },
  'decent-core-shell-end-request': function onEndRequest(scope, payload) {
    var request = payload.request;
    if (!request) return;
    var contentManager = request.contentManager;
    if (contentManager) {
      delete contentManager.items;
      delete contentManager.itemsToFetch;
      delete contentManager.shapes;
    }
    delete request.contentManager;
    delete request.layout;
  }
};

/**
 * @description
 * Promises to get one or several content items.
 * @param {string|Array} id the id or ids of the items to fetch.
 * @param {Function} [callback] A function with signature (err, item)
 *                              that will get called once per item once
 *                              the item has been loaded.
 */
ContentManager.prototype.promiseToGet = function promiseToGet(id, callback) {
  var self = this;
  var itemsToFetch = self.itemsToFetch;
  // id can be an array of ids
  id = Array.isArray(id) ? id : [id];
  id.forEach(function forEachId(itemId) {
    if (itemsToFetch.hasOwnProperty(itemId)) {
      if (callback) {
        itemsToFetch[itemId].push(callback);
      }
    }
    else {
      itemsToFetch[itemId] = callback ? [callback] : [];
    }
  });
};

/**
 * @description
 * Gets an item from the collection of items that the content
 * manager has already fetched. If not found, null, is returned.
 * @param {string} id The id of the item to fetch.
 * @returns {object} The content item, or null if not found.
 */
ContentManager.prototype.getAvailableItem = function getAvailableItem(id) {
  var item = this.items[id];
  if (item) return item;
  return null;
};

/**
 * @description
 * Triggers the asynchronous fetching of the items whose
 * ids can be found in the content manager's itemsToFetch
 * array, anf their transfer into the items array.
 * This method emits the decent.core.load-items event.
 * @param payload
 * @param {Function} [payload.callback] a callback that gets
 * called when all items have been fetched, or when an error
 * occurs.
 */
ContentManager.prototype.fetchItems = function fetchItems(payload) {
  // TODO: refactor this to use the async library.
  // TODO: make callback a parameter, not an option of payload.
  var self = this;
  var callback = payload.callback;
  for (var id in self.itemsToFetch) {
    if (self.items.hasOwnProperty(id)
      && self.itemsToFetch
      && self.itemsToFetch.hasOwnProperty(id)) {
      // items was already fetched, just call the callback
      // and remove the item from the list to fetch.
      for (var i = 0; i < self.itemsToFetch[id].length; i++) {
        var callback = self.itemsToFetch[id][i];
        if (callback) callback(null, self.items[id]);
      }
      delete self.itemsToFetch[id];
    }
  }
  if (payload.request && Object.getOwnPropertyNames(self.itemsToFetch).length > 0) {
    // Now broadcast the list for content stores to do their job
    payload.request.emit(ContentManager.loadItemsEvent, {
      items: self.items,
      itemsToFetch: self.itemsToFetch,
      callback: function () {
        self.itemsFetchedCallback(null, {
          callback: callback
        });
      }
    });
  }
  // Each handler should have synchronously removed the items it can take care of.
  if (self.itemsToFetch && Object.getOwnPropertyNames(self.itemsToFetch).length > 0) {
    var t = this.scope.require('localization');
    var error = new Error(t('Couldn\'t load items %s', require('util').inspect(self.items)));
    if (callback) callback(error,  self.items);
  }
};

// This will disappear once the item fetching uses async:
// this is the last callback after all items have come back from storage.
ContentManager.prototype.itemsFetchedCallback = function itemsFetchedCallback(err, data) {
  if (err) {
    if (data.callback) data.callback(err);
    return;
  }
  // If all items have been loaded from storage, it's time to start the next task
  // TODO: what happens if not all items can be fetched?
  if (Object.getOwnPropertyNames(this.itemsToFetch).length === 0) {
    data.callback();
  }
};

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
ContentManager.prototype.promiseToRender = function promiseToRender(options) {
  if (!options.request.shapes) {
    options.request.shapes = [];
  }
  if (options.id) {
    this.promiseToGet(options.id);
    options.request.shapes.push({
      meta: {
        type: 'shape-item-promise'
      },
      temp: {
        displayType: options.displayType
      },
      id: options.id
    });
  }
  else if (options.shape) {
    options.request.shapes.push(options.shape);
  }
};

/**
 * @description
 * Builds the rendered page from the list of shapes that was prepared
 * so far. This method defines the rendering lifecycle, by emitting
 * events:
 * * decent.core.shape.placement
 * * decent.core.handle-item
 * * decent.core.shape.render
 * @param payload
 * @param {IncomingMessage} [payload.request] The request.
 * @param {ServerResponse}  [payload.response] The response.
 */
ContentManager.prototype.buildRenderedPage = function buildRenderedPage(payload) {
  // TODO: use request and response everywhere instead of req, res
  var request = payload.request;
  var response = payload.response;
  var shapes = request.shapes;
  var layout = request.layout = {meta: {type: 'layout'}};
  // Build the shape tree through placement strategies
  request.emit(ContentManager.placementEvent, {
    shape: layout,
    shapes: shapes
  });
  // Render the shape tree
  var renderStream = request.require('render-stream', {contentManager: this});
  // TODO: add filters, that are just additional pipes before res.
  renderStream.on('data', function(data) {
    response.write(data);
  });
  // TODO: enable handlers to do async
  // Let handlers manipulate items and shapes
  request.emit(ContentManager.handleItemEvent, {
    shape: layout,
    renderStream: renderStream
  });
  // Call for meta, script, and style sheet registration
  request.emit(ContentManager.registerMetaEvent, {renderStream: renderStream});
  request.emit(ContentManager.registerStyleEvent, {renderStream: renderStream});
  request.emit(ContentManager.registerScriptEvent, {renderStream: renderStream});
  // Render
  request.emit(ContentManager.renderShapeEvent, {
    shape: layout,
    renderStream: renderStream
  });
  // Tear down
  renderStream.end();
  var t = this.scope.require('localization');
  console.log(t('Request handled %s in %s ms.', request.url, new Date() - request.startTime));
};

/**
 * @description
 * Finds the type definition of an item if it exists on the tenant configuration.
 * @param {object} item The content item.
 * @returns {object} The content type, or null if it can't be found.
 */
ContentManager.prototype.getType = function getType(item) {
  var typeName, type;
  if (!item.meta
    || !(typeName = item.meta.type)
    || !this.scope.types
    || !(type = this.scope.types[typeName])) return null;
  return type;
};

/**
 * @description
 * Gets a list of part names that are of the part type the gets passed in.
 * @param {object} item         The content item.
 * @param {string} partTypeName The name of the part type to look for.
 * @returns {Array} An array of part names.
 */
ContentManager.prototype.getParts = function getParts(item, partTypeName) {
  var type = this.getType(item);
  if (!type) return [];
  var parts = [];
  for (var partName in type.parts) {
    var partDefinition = type.parts[partName];
    if (partDefinition.type !== partTypeName) continue;
    parts.push(partName);
  }
  return parts;
}

// TODO: make event names consistent everywhere
// TODO: finish documenting emitted events

/**
 * @description
 * This event is emitted when content items should be fetched from stores.
 */
ContentManager.loadItemsEvent = 'decent.core.load-items';
ContentManager.loadItemsEvent.payload = {
  /**
   * @description
   * The current map of id to item that we already have. The handlers add to this map.
   */
  items: 'Object',
  /**
   * @description
   * The list of item ids to fetch from the stores.
   * Handlers must remove from this list what they were able to successfully fetch.
   */
  itemsToFetch: 'Array',
  /**
   * @description
   * A function that handlers must call after they are done. This should be done asynchronously.
   */
  callback: 'Function'
};

/**
 * @description
 * This item lets handlers manipulate the shapes before
 * they get rendered.
 * Handlers are responsible for drilling into the tree according to
 * their knowledge of the shapes they are handling.
 */
ContentManager.handleItemEvent = 'decent.core.handle-item';
ContentManager.handleItemEvent.payload = {
  /**
   * @description
   * The root shape
   */
  shape: 'object',
  /**
   * @description
   * The renderer
   */
  renderStream: 'RenderStream'
};

/**
 * @description
 * Asks for a list of shapes to be placed under a root shape.
 */
ContentManager.placementEvent = 'decent.core.shape.placement';
ContentManager.placementEvent.payload = {
  /**
   * @description
   * The root shape under which to place the shapes in the list.
   */
  shape: 'Object',
  /**
   * @description
   * The list of shapes to place.
   */
  shapes: 'Array'
};

/**
 * Calls for meta tag registering.
 */
ContentManager.registerMetaEvent = 'decent.core.register-meta';
ContentManager.registerMetaEvent.payload = {
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

/**
 * Calls for style sheet registering.
 */
ContentManager.registerStyleEvent = 'decent.core.register-style';
ContentManager.registerStyleEvent.payload = {
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

/**
 * Calls for script registering.
 */
ContentManager.registerScriptEvent = 'decent.core.register-script';
ContentManager.registerScriptEvent.payload = {
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

/**
 * Calls for shape rendering.
 */
ContentManager.renderShapeEvent = 'decent.core.shape.render';
ContentManager.renderShapeEvent.payload = {
  /**
   * @description
   * The shape to render
   */
  shape: 'Object',
  /**
   * The render stream that handles the html to render.
   */
  renderStream: 'RenderStream'
};

module.exports = ContentManager;