// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';
/**
 * @description
 * Wraps an object in a content item.
 */
function ContentItem(document) {
  return document;
}

function Service(shell) {
  this.shell = shell;
}
Service.prototype.ContentItem = ContentItem;

module.exports = Service;