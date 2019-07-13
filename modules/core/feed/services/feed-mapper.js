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
    const summarize = (scope.require('summarize-strategy') || {summarize: text => text}).summarize;
    const combine = (base, path) =>
      !path ? base :
      (base.length > 0 && base[base.length - 1] === '/' ? base.substr(0, base.length - 1) : base) + '/' +
      (path.length > 0 && path[0] === '/' ? path.substr(1) : path);
    const url = id => combine(item.baseUrl, id);
    const meta = shape.meta(item);
    const parse = require('esprima').parse;
    const evaluate = require('static-eval');
    const astCache = scope['ast-cache'] || (scope['ast-cache'] = {});
    const parseToAst = source => astCache[source] || (astCache[source] = parse('(' + source + ')').body[0].expression);
    const parseToFunction = source => (context) => evaluate(parseToAst(source), context);
    // Find mapping data if it exists, use default mappings otherwise
    let feedMapping = context => ({
      title: context.feed.title && context.feed.title.text
        ? context.feed.title.text
        : context.feed.title || context.site.name,
      description: context.feed.body ? context.feed.body.text : null,
      id: context.feed.url,
      link: context.feed.url,
      image: url(context.site.icon),
      favicon: url(context.site.favicon),
      copyright: context.site.copyright,
      generator: 'DecentCMS',
      author: {
        name: context.site.authors.join(', '),
        email: context.site.email
      },
      postsShapeName: 'query-results',
      postsShapeProperty: 'results'
    });
    let postMapping = context => ({
      title: context.post.title,
      id: url(context.post.url),
      link: url(context.post.url),
      description: context.post.summary
        || summarize(context.post.body ? context.post.body.html || context.post.body : ""),
      content: context.post.body ? context.post.body.html : null,
      author: {
        name: context.post.authors ? context.post.authors.join(', ') : null,
        email: context.post.email
      },
      date: new Date(context.post.date),
      image: context.post.image ? url(context.post.image) : null
    });
    const compose = (f1, f2) => (context) => Object.assign(f1(context), f2(context));
    const type = cm.getType(item);
    if (type) {
      if (type.feedMapping) feedMapping = compose(feedMapping, parseToFunction(type.feedMapping));
      if (type.postMapping) postMapping = compose(postMapping, parseToFunction(type.postMapping));
    }
    if (meta.feedMapping) feedMapping = compose(feedMapping, parseToFunction(meta.feedMapping));
    if (meta.postMapping) postMapping = compose(postMapping, parseToFunction(meta.postMapping));
    // Map the feed properties
    const feed = feedMapping({feed: item, site: scope.settings, url, summarize});
    feed.posts = [];
    const postsShape = item[feed.postsShapeName];
    if (postsShape) {
      const posts = postsShape[feed.postsShapeProperty];
      if (posts) {
        posts.forEach(post => {
          post.url = post.url || item.baseUrl + post.id;
          const mappedPost = postMapping({post, site: scope.settings, url, summarize});
          feed.posts.push(mappedPost);
        });
      }
    }
    return feed;
  }
};

module.exports = defaultFeedMapper;