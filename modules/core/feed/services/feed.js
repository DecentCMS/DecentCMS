// DecentCMS (c) 2018 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function fetchItem(id, scope, callback) {
  const storage = scope.require('storage-manager');
  storage.promiseToGet(id);
  storage.fetchContent({scope}, function (err) {
    if (err) {
      callback(err);
      return;
    }
    const item = storage.getAvailableItem(id);
    if (item) {
      scope.callService('part-loader', 'load', { scope: scope, item }, function handleShape() {
        const shape = {
          meta: {type: 'content'},
          temp: {item, shapes: []}
        };
        scope.callService('shape-handler', 'handle', { scope: scope, shape }, function renderShapeJson(err) {
          if (err) {
            callback(err);
            return;
          }
          const shapes = shape.temp.shapes;
          const result = {};
          shapes.forEach(function copyShape(shape) {
            if (shape.meta) {
              result[shape.meta.name] = shape;
            }
          });
          result.meta = item.meta;
          callback(null, result);
          return;
        });
      });
    }
    else {
      callback(null);
    }
  });
}

/**
 * This handler registers itself as an Express middleware that handles
 * a catchall route with a relatively low priority, for the feed API.
 */
const feedRouteHandler = {
  service: 'middleware',
  feature: 'feed',
  routePriority: 8000,
  scope: 'shell',
  /**
   * Registers the default feed API middleware.
   * * `/rss/` after a content item id gets a RSS feed for it.
   * * `/atom/` after a content item id gets an Atom feed for it.
   * * `/json/` after a content item id gets a JSON feed for it.
   * @param {object} scope The scope.
   * @param {object} context The context.
   * @param {object} context.expressApp The Express application object.
   */
  register: function registerContentApiMiddleware(scope, context) {
    const Feed = require('feed').Feed;
    context.expressApp.register(feedRouteHandler.routePriority, function bindContentMiddleware(app) {
      app.get(/^(\/.*)?\/(rss|atom|json)$/, function contentShapeMiddleware(request, response, next) {
        if (request.routed) {
          next();
          return;
        }
        const format = request.url.substr(request.url.lastIndexOf('/') + 1);
        const id = request.path === '/rss' || request.path === '/atom' || request.path === 'json'
          ? '/' : require('querystring').unescape(request.path.substr(0, request.path.length - format.length - 1));
        response.type(format);
        if (id) {
          fetchItem(id, request, function(err, item) {
            if (err) {
              response.status(500);
              response.json({error: err});
              next(err);
            }
            else if (!item) {
              response.status(404);
              response.json({error: 'Not found'});
        
              request.routed = true;
              request.handled = true;
              next();
            }
            else {
              const feedMapper = scope.require('feed-mapper');
              if (feedMapper) {
                item.site = scope.settings;
                const port = request.connection.localPort;
                const isDefaultPort = port === (request.protocol === 'https' ? 443 : 80);
                item.site.baseUrl = item.site.baseUrl || `${request.protocol}://${request.hostname}${isDefaultPort ? '': `:${port}`}`;
                item.url = item.url || item.site.baseUrl + id;
                const feedData = feedMapper.map(scope, item);
                const posts = feedData.posts || [];
                delete feedData.posts;
                const feed = new Feed(feedData);
                posts.forEach(post => {feed.addItem(post)});
                response.send(
                  format === 'rss' ? feed.rss2() :
                  format === 'atom' ? feed.atom1() :
                  feed.json1());
              }
            }
          });
        }
      });
    });
  }
};

module.exports = feedRouteHandler;