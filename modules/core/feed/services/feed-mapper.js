// DecentCMS (c) 2018 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Map lists of content items to feeds.
 */
const defaultFeedMapper = {
  service: 'feed-mapper',
  feature: 'default-feed-mapper',
  scope: 'shell',
  /**
   * Maps a content item to feed data (metadata and items) compatible with the [Feed](https://github.com/jpmonette/feed) library.
   * @param {object} scope The scope.
   * @param {object} item The item to map
   * @returns {object} The mapped feed data.
   */
  map: function mapItemToFeed(scope, item) {
    const cm = scope.require('content-manager');
    const shape = scope.require('shape');
    const meta = shape.meta(item);
    const parse = require('esprima').parse;
    const evaluate = require('static-eval');
    const astCache = scope['ast-cache'] || (scope['ast-cache'] = {});
    const parseToAst = source => astCache[source] || (astCache[source] = parse('(' + source + ')').body[0].expression);
    const parseToFunction = source => (item, site) => evaluate(parseToAst(source), {item, site});
    // Find mapping data if it exists, use default mappings otherwise
    const combine = (base, path) =>
      (base.length > 0 && base[base.length - 1] === '/' ? base.substr(0, base.length - 1) : base) + '/' +
      (path.length > 0 && path[0] === '/' ? path.substr(1) : path);
    let feedMapping = (feedItem, site) => ({
      title: feedItem.title && feedItem.title.text ? feedItem.title.text : feedItem.title ? feedItem.title : site.name,
      description: feedItem.body ? feedItem.body.text : null,
      id: feedItem.url,
      link: feedItem.url,
      image: combine(feedItem.baseUrl, site.icon),
      favicon: combine(feedItem.baseUrl, site.favicon),
      copyright: site.copyright,
      generator: 'DecentCMS',
      author: {
        name: site.authors.join(', '),
        email: site.email
      },
      postsShapeName: 'query-results',
      postsShapeProperty: 'results'
    });
    let postMapping = post => ({
      title: post.title,
      id: combine(item.baseUrl, post.url),
      link: combine(item.baseUrl, post.url),
      description: post.summary,
      content: post.body ? post.body.text : null,
      author: {
        name: post.authors ? post.authors.join(', ') : null,
        email: post.email
      },
      date: new Date(post.date),
      image: combine(item.baseUrl, post.image)
    });
    const compose = (f1, f2) => (item, site) => Object.assign(f1(item, site), f2(item, site));
    const type = cm.getType(item);
    if (type) {
      if (type.feedMapping) feedMapping = compose(feedMapping, parseToFunction(type.feedMapping));
      if (type.postMapping) postMapping = compose(postMapping, parseToFunction(type.postMapping));
    }
    if (meta.feedMapping) feedMapping = compose(feedMapping, parseToFunction(meta.feedMapping));
    if (meta.postMapping) postMapping = compose(postMapping, parseToFunction(meta.postMapping));
    // Map the feed properties
    const feed = feedMapping(item, scope.settings);
    feed.posts = [];
    const postsShape = item[feed.postsShapeName];
    if (postsShape) {
      const posts = postsShape[feed.postsShapeProperty];
      if (posts) {
        posts.forEach(post => {
          post.url = post.url || item.baseUrl + post.id;
          const mappedPost = postMapping(post, scope.settings);
          feed.posts.push(mappedPost);
        });
      }
    }
    return feed;
  }
};

module.exports = defaultFeedMapper;