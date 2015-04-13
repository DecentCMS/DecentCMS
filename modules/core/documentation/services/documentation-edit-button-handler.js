// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Handler for a part that builds an edit button for documentation topics.
 */
var DocumentationEditButtonHandler = {
  feature: 'documentation',
  service: 'shape-handler',
  scope: 'request',
  /**
   * Build a shape for the edit button for documentation topics.
   * @param {object} context The context object.
   * @param {object} context.shape The content shape that has the part.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function documentationEditButtonHandler(context, done) {
    var content = context.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp
      || !content.temp.item
      || !content.temp.item.meta
      || content.temp.item.meta.type !== 'documentation-edit-button') {
      done();
      return;
    }
    var scope = context.scope;
    var repositoryResolver = scope.require('repository-resolution');
    if (repositoryResolver) {
      var itemId = scope.itemId;
      var rootSeparatorIndex = itemId.indexOf(':');
      var root = 'content';
      var localId = itemId;
      if (rootSeparatorIndex !== -1) {
        root = itemId.substr(0, rootSeparatorIndex);
        localId = itemId.substr(rootSeparatorIndex + 1);
      }
      var possiblePath = null;
      var pathMappers = scope.getServices('id-to-path-map');
      var fs = require('fs');
      for (var i = pathMappers.length - 1; i >= 0; i--) {
        var paths = pathMappers[i].mapIdToPath(root, localId);
        if (paths) {
          var actualPath = paths.filter(function fileExists(p) {
            return fs.existsSync(p);
          });
          if (actualPath.length > 0) {
            possiblePath = actualPath[0];
            break;
          }
        }
      }
      if (possiblePath) {
        var editUrl = repositoryResolver.resolve(possiblePath, "edit");
        if (editUrl && content.temp.shapes) {
          var item = content.temp.item;
          content.temp.shapes.push({
            meta: {
              type: 'documentation-edit-button',
              item: item
            },
            text: item.text,
            url: editUrl
          });
        }
      }
    }
    done();
  }
};

module.exports = DocumentationEditButtonHandler;