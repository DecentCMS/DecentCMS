// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Maps a content item's id to the list of file paths that could
 * possibly have descriptions of the item.
 * @constructor
 */
var ContentPathMapper = function ContentPathMapper(scope) {
  this.scope = scope;
};
ContentPathMapper.service = 'id-to-path-map';
ContentPathMapper.feature = 'file-content-store';
ContentPathMapper.scope = 'shell';

/**
 * Maps a content item's id to the list of file paths that could
 * possibly have descriptions of the item.
 * @param {string} root The content root for this item (content, widget, etc.).
 * @param {string} id The item's id under the root.
 * @returns {string[]} The list of possible paths for a file describing the item.
 */
ContentPathMapper.prototype.mapIdToPath = function mapContentIdToPath(root, id) {
  var path = require('path');
  var shell = this.scope.require('shell');

  var siteDataRoot = shell.rootPath;
  var itemFolderPath = path.join(siteDataRoot, root, id);
  // First look for a id/index.json file, then id/index.yaml, then id/index.yaml.md,
  // then id.json, id.yaml, and finally id.yaml.md
  var indexPath = path.join(itemFolderPath, 'index');
  return [
    indexPath + '.json',
    indexPath + '.yaml',
    indexPath + '.yaml.md',
    itemFolderPath + '.json',
    itemFolderPath + '.yaml',
    itemFolderPath + '.yaml.md'
  ];
};

module.exports = ContentPathMapper;