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
    if (middleware.getUrl) {
      var url = middleware.getUrl(id);
      if (url) return url;
    }
  }
  return '/';
};
module.exports = UrlHelper;