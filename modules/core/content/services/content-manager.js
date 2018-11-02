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

/**
 * Finds the type name of an item if it exists on the tenant configuration.
 * @param {object} item The content item.
 * @returns {string} The content type name, or null if it can't be found.
 */
ContentManager.prototype.getTypeName = function getTypeName(item) {
  return item && item.meta ? item.meta.type : null;
}

/**
 * Finds the type definition of an item if it exists on the tenant configuration.
 * @param {object} item The content item.
 * @returns {object} The content type definition, or null if it can't be found.
 */
ContentManager.prototype.getType = function getType(item) {
  var typeName, type;
  if (!item
    || !item.meta
    || !(typeName = item.meta.type)
    || !this.scope.settings.content.types
    || !(type = this.scope.settings.content.types[typeName])) return null;
  return type;
};

/**
 * Gets a list of part names that are of the part type the gets passed in.
 * @param {object} item           The content item.
 * @param {string} [partTypeName] The name of the part type to look for. All parts are returned if this is not specified.
 * @returns {Array} An array of part names.
 */
ContentManager.prototype.getPartNames = function getParts(item, partTypeName) {
  var parts = new Set();
  var type = this.getType(item);
  if (type) {
    // Look for parts of that type on the content type definition.
    for (var partName in type.parts) {
      var partDefinition = type.parts[partName];
      if (partTypeName && (
        (partDefinition.type !== partTypeName)
        || (item[partName] && item[partName].meta && (item[partName].meta.type !== partTypeName)))) continue;
      parts.add(partName);
    }
  }
  // Also look for self-typed parts on the content item.
  for (partName in item) {
    var part = item[partName];
    if ((!partTypeName || (part && part.meta && part.meta.type && part.meta.type === partTypeName)) && partName !== 'meta' && partName !== 'temp') {
      parts.add(partName);
    }
  }
  return Array.from(parts);
};

/**
 * Gets a list of parts that are of the part type the gets passed in.
 * @param {object} item           The content item.
 * @param {string} [partTypeName] The name of the part type to look for. All parts are returned if this is not specified.
 * @returns {Array} An array of parts.
 */
ContentManager.prototype.getParts = function getParts(item, partTypeName) {
  var partNames = this.getPartNames(item, partTypeName);
  return partNames.map(function(name) {return item[name] || null}).filter(function(part) {return !!part;});
}

/**
 * Finds the type of a part.
 * @param {object} item     The content item.
 * @param {string} partName The part's name.
 * @returns {string} The name of the type of the part.
 */
ContentManager.prototype.getPartType = function getPartType(item, partName) {
  var part = item[partName];
  if (part  && part.meta && part.meta.type) return part.meta.type;
  var typeDefinition = this.getType(item);
  return typeDefinition && typeDefinition.parts && typeDefinition.parts[partName]
    ? typeDefinition.parts[partName].type
    : null;
}

module.exports = ContentManager;