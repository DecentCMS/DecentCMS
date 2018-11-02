// DecentCMS (c) 2018 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

const DefaultFeedMapper = {
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
    const feed = {author: {}};
    const cm = scope.require('content-manager');
    const token = scope.require('tokens');
    const shape = scope.require('shape');
    const meta = shape.meta(item);
    // Find mapping data if it exists, use default mappings otherwise
    const feedMapping = {
      title: '{{title.text}}',
      description: '{{body.text}}',
      id: '{{itemUrl}}',
      link: '{{itemUrl}}',
      image: '{{baseUrl}}{{site.icon}}',
      favicon: '{{baseUrl}}{{site.favicon}}',
      copyright: '{{site.copyright}}',
      generator: 'DecentCMS',
      authorName: '{{site.authors|join>, }}',
      email: '{{site.email}}',
      postsShapeName: 'query-results',
      postsShapeProperty: 'results'
    };
    const postMapping = {
      title: '{{title}}',
      id: '{{baseUrl}}/{{url}}',
      link: '{{baseUrl}}/{{url}}',
      description: '{{summary}}',
      content: '{{body.text}}',
      authorName: '{{authors|join>, }}',
      email: '{{email}}',
      date: '{{date}}',
      image: '{{image}}'
    };
    const type = cm.getType(item);
    if (type) {
      if (type.feedMapping) Object.assign(feedMapping, type.feedMapping);
      if (type.postMapping) Object.assign(postMapping, type.postMapping);
    }
    if (meta.feedMapping) Object.assign(feedMapping, meta.feedMapping);
    if (meta.postMapping) Object.assign(postMapping, meta.postMapping);
    // Map the feed properties
    Object.getOwnPropertyNames(feedMapping)
      .forEach(property => {
        const value = token.interpolate(feedMapping[property], item);
        switch (property) {
          case 'authorName':
            feed.author.name = value;
            break;
          case 'email':
            feed.author.email = value;
            break;
          case 'authorLink':
            feed.author.link = value;
          default:
            feed[property] = value;
        }
      });
    feed.posts = [];
    const postsShape = item[feedMapping.postsShapeName];
    if (postsShape) {
      const posts = postsShape[feedMapping.postsShapeProperty];
      if (posts) {
        posts.forEach(post => {
          post.baseUrl = item.baseUrl;
          post.itemUrl = item.itemUrl;
          const mappedPost = {};
          Object.getOwnPropertyNames(postMapping)
            .forEach(property => {
              const value = token.interpolate(postMapping[property], post);
              if (value === '???') return;
              mappedPost[property] = value;
            });
          mappedPost.date = new Date(mappedPost.date);
          feed.posts.push(mappedPost);
        });
      }
    }
    return feed;
  }
};

module.exports = DefaultFeedMapper;