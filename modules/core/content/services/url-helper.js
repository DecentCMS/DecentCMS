// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Utilities to manipulate content item URLs.
 * @constructor
 */
class UrlHelper {
  constructor(scope) {
    this.scope = scope;
  }

  /**
   * Gets the URL for a content item by asking all middleware.
   * @param {string} id The id of the content item.
   * @returns {string} The URL for the content item.
   */
  getUrl(id) {
    const middlewareList = this.scope.getServices('middleware')
      .sort((m1, m2) => m1.routePriority - m2.routePriority);
    for (let i = 0; i < middlewareList.length; i++) {
      const middleware = middlewareList[i];
      if (middleware.hasOwnProperty('getUrl')) {
        const url = middleware.getUrl(id);
        if (url) return url;
      }
    }
    return '/';
  }

  /**
   * Gets the content item ID for a URL, if the URL corresponds to a
   * content-item, by asking all middleware.
   * @param {string} url The URL to resolve.
   * @returns {string} The content item ID for the URL, or null if none was found.
   */
  getId(url) {
    const middlewareList = this.scope.getServices('middleware')
      .sort((m1, m2) => m1.routePriority - m2.routePriority);
    for (let i = 0; i < middlewareList.length; i++) {
      const middleware = middlewareList[i];
      if (middleware.hasOwnProperty('getId')) {
        const id = middleware.getId(url);
        if (id) return id;
      }
    }
    return null;
  }
}
UrlHelper.feature = 'content';
UrlHelper.service = 'url-helper';
UrlHelper.scope = 'shell';


module.exports = UrlHelper;