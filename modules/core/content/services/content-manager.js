// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * The ContentManager is responsible for facilitating the usage of content items,
 * content parts, and content types.
 */
function ContentManager(scope) {
  this.scope = scope;
}
ContentManager.feature = 'content';
ContentManager.service = 'content-manager';
ContentManager.scope = 'shell';
ContentManager.isScopeSingleton = true;

/**
 * @description
 * Finds the type definition of an item if it exists on the tenant configuration.
 * @param {object} item The content item.
 * @returns {object} The content type, or null if it can't be found.
 */
ContentManager.prototype.getType = function getType(item) {
  // TODO: allow for dynamic, single-use types defined directly in the item
  var typeName, type;
  if (!item
    || !item.meta
    || !(typeName = item.meta.type)
    || !this.scope.settings.content.types
    || !(type = this.scope.settings.content.types[typeName])) return null;
  return type;
};

/**
 * @description
 * Gets a list of part names that are of the part type the gets passed in.
 * @param {object} item         The content item.
 * @param {string} partTypeName The name of the part type to look for.
 * @returns {Array} An array of part names.
 */
ContentManager.prototype.getParts = function getParts(item, partTypeName) {
  var type = this.getType(item);
  if (!type) return [];
  var parts = [];
  // Look for parts of that type on the content type definition.
  for (var partName in type.parts) {
    var partDefinition = type.parts[partName];
    if (partDefinition.type !== partTypeName
      || (item[partName]
      && item[partName].meta
      && item[partName].meta.type)) continue;
    parts.push(partName);
  }
  // Also look for self-typed parts on the content item.
  for (partName in item) {
    var part = item[partName];
    if (part && part.meta && part.meta.type && part.meta.type === partTypeName && partName !== 'meta' && partName !== 'temp') {
      parts.push(partName);
    }
  }
  return parts;
};

module.exports = ContentManager;