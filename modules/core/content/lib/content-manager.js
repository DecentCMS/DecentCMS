// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var t = require('decent-core-localization').t;

function ContentManager(shell) {
  this.shell = shell;
  this.items = {};
  this.itemsToFetch = {};
  this.shapes = [];
}

ContentManager.on = {
  'decent-core-shell-start-request': function(shell, payload) {
    // Create a content manager for the duration of the request.
    payload.req.contentManager = new ContentManager(shell);
  },
  'decent.core.shell.fetch-content': function(shell, payload) {
    if (!payload.req) return;
    // Find the content manager for the current request
    var contentManager = payload.req.contentManager;
    if (!contentManager) return;
    // Use it to fetch items from the content store
    contentManager.fetchItems(payload);
  },
  'decent.core.shell.render-page': function(shell, payload) {
    if (!payload.req) return;
    // Find the content manager for the current request
    var contentManager = payload.req.contentManager;
    if (!contentManager) return;
    // Use it to build the rendered page
    contentManager.buildRenderedPage(payload);
  },
  'decent-core-shell-end-request': function(shell, payload) {
    var request = payload.req;
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

ContentManager.prototype.get = function(id, callback) {
  var self = this;
  var itemsToFetch = self.itemsToFetch;
  // id can be an array of ids
  id = Array.isArray(id) ? id : [id];
  id.forEach(function(itemId) {
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

ContentManager.prototype.getAvailableItem = function(id) {
  var item = this.items[id];
  if (item) return item;
  return null;
};

ContentManager.prototype.fetchItems = function(payload) {
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
        if (callback) callback(self.items[id]);
      }
      delete self.itemsToFetch[id];
    }
  }
  // Now broadcast the list for content stores to do their job
  self.shell.emit(self.loadItemsEvent, {
    items: self.items,
    itemsToFetch: self.itemsToFetch,
    callback: function() {
      self.itemsFetchedCallback(null, {
        callback: callback
      });
    }
  });
  // Each handler should have synchronously removed the items it can take care of.
  if (Object.getOwnPropertyNames(self.items).length > 0) {
    var error = new Error(t('Couldn\'t load items %s', require('util').inspect(self.items)));
    if (callback) callback(error,  self.items);
  }
};

ContentManager.prototype.itemsFetchedCallback = function(err, data) {
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

ContentManager.prototype.render = function(options) {
  if (!options.req.shapes) {
    options.req.shapes = [];
  }
  if (options.id) {
    this.get(options.id);
    options.req.shapes.push({
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
    options.req.shapes.push(options.shape);
  }
};

ContentManager.prototype.buildRenderedPage = function(payload) {
  var req = payload.req;
  var res = payload.res;
  var shapes = req.shapes;
  var layout = req.layout = {meta: {type: 'layout'}};
  // Build the shape tree through placement strategies
  this.shell.emit('decent.core.shape.placement', {
    shape: layout,
    shapes: shapes
  });
  // Render the shape tree
  var renderStream = this.shell.require('render-stream', {contentManager: this});
  // TODO: add filters, that are just additional pipes before res.
  renderStream.on('data', function(data) {
    res.write(data);
  });
  // TODO: enable handlers to do async
  // Let handlers manipulate items and shapes
  this.shell.emit(ContentManager.handleItemEvent, {
    shape: layout,
    renderStream: renderStream
  });
  // Render
  this.shell.emit('decent.core.shape.render', {
    shape: layout,
    renderStream: renderStream
  });
  // Tear down
  renderStream.end();
  console.log(t('%s handled %s in %s ms.', this.shell.name, req.url, new Date() - req.startTime));
};

/**
 * @description
 * Finds the type definition of an item if it exists on the tenant configuration.
 * @param {object} item The content item.
 * @returns {*} The content type, or null if it can't be found.
 */
ContentManager.prototype.getType = function(item) {
  var typeName, type;
  if (!item.meta
    || !(typeName = item.meta.type)
    || !this.shell.types
    || !(type = this.shell.types[typeName])) return null;
  return type;
};

/**
 * @description
 * Gets a list of part names that are of the part type the gets passed in.
 * @param {object} item         The content item.
 * @param {string} partTypeName The name of the part type to look for.
 * @returns {Array} An array of part names.
 */
ContentManager.prototype.getParts = function(item, partTypeName) {
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
// TODO: don't use the shell as a universal event bus. Instead, make ContentManager and others EventEmitters
// TODO: finish documenting emitted events

/**
 * @description
 * This event is emitted when content items should be fetched from stores.
 */
ContentManager.loadItemsEvent = ContentManager.prototype.loadItemsEvent = 'decent.core.load-items';
ContentManager.loadItemsEvent.payload = {
  /**
   * @description
   * The current map of id to item that we already have. The handlers add to this map.
   */
  items: Object,
  /**
   * @description
   * The list of item ids to fetch from the stores.
   * Handlers must remove from this list what they were able to successfully fetch.
   */
  itemsToFetch: Array,
  /**
   * @description
   * A function that handlers must call after they are done. This should be done asynchronously.
   */
  callback: Function
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
   * The content item shape
   */
  item: Object,
  /**
   * @description
   * The shell
   */
  shell: Object
};

module.exports = ContentManager;