// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * The menu part handler creates menu shapes.
 */
var MenuPartHandler = {
  feature: 'navigation',
  service: 'menu-part-handler',
  /**
   * Adds a menu shape to `context.shapes` for the menu part on the context.
   * @param {object} context The context object.
   * @param {object} context.part The menu part to handle.
   * @param {string} context.partName The name of the part.
   * @param {string} context.displayType The display type.
   * @param {object} context.item A reference to the content item.
   * @param {Array} context.shapes The shapes array to which new shapes must be pushed.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function handleMenuPart(context, done) {
    var shapes = context.shapes;
    if (!shapes) {done();return;}
    var menu = context.part.name;
    var navigationContext = { menu };
    context.scope.callService('navigation-service', 'query', navigationContext, function() {
      var shape = context.part;
      var id = context.item.id;
      var colonIndex = id ? id.indexOf(':') : -1;
      if (colonIndex !== -1) id = id.substr(colonIndex + 1);
      shape.meta = {
        type: 'menu',
        name: context.partName,
        alternates: [
          'menu-' + context.partName,
          'menu-' + id
        ]
      };
      shape.temp = {
        displayType: context.displayType,
        item: context.item
      };
      shape.items = navigationContext.items;
      shape.current = context.scope.url;
      shapes.push(shape);
      done();
    });
  }
};

module.exports = MenuPartHandler;