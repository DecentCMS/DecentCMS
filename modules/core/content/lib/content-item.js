// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';
/**
 * @description
 * Wraps an object in a content item.
 */
function ContentItem(document) {
  return document;
}

function ContentManager(shell) {
  this.shell = shell;
}
ContentManager.prototype.ContentItem = ContentItem;

module.exports = Service;