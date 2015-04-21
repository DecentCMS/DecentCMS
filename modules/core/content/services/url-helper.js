// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Utilities to manipulate content item URLs.
 * @constructor
 */
function UrlHelper(scope) {
  this.scope = scope;
}
UrlHelper.feature = 'content';
UrlHelper.service = 'url-helper';
UrlHelper.scope = 'shell';
/**
 * Gets the URL for a content item by asking all middleware.
 * @param {string} id The id of the content item.
 * @returns {string} The URL for the content item.
 */
UrlHelper.prototype.getUrl = function getUrl(id) {
  var middlewares = this.scope.getServices('middleware')
    .sort(function(m1, m2) {
      return m1.routePriority - m2.routePriority;});
  for (var i = 0; i < middlewares.length; i++) {
    var middleware = middlewares[i];
    if (middleware.hasOwnProperty('getUrl')) {
      var url = middleware.getUrl(id);
      if (url) return url;
    }
  }
  return '/';
};
/**
 * Gets the content item ID for a URL, if the URL corresponds to a
 * content-item, by asking all middleware.
 * @param {string} url The URL to resolve.
 * @returns {string} The content item ID for the URL, or null if none was found.
 */
UrlHelper.prototype.getId = function getId(url) {
  var middlewareList = this.scope.getServices('middleware')
    .sort(function(m1, m2) {
      return m1.routePriority - m2.routePriority;});
  for (var i = 0; i < middlewareList.length; i++) {
    var middleware = middlewareList[i];
    if (middleware.hasOwnProperty('getId')) {
      var id = middleware.getId(url);
      if (id) return id;
    }
  }
  return null;
};
module.exports = UrlHelper;