// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var async = require('async');
// TODO: extensibility so different types of menu items can be rendered differently

function menuTemplate(menu, renderer, done) {
  if (!menu.items || menu.items.length === 0) return done();

  var shapeHelper = renderer.scope.require('shape');
  var menuMeta = shapeHelper.meta(menu);

  renderer.startTag('ul');

  async.eachSeries(
    menu.items,
    function forEachMenuItem(menuItem, next) {
      var itemMeta = shapeHelper.meta(menuItem);
      if (!itemMeta.type) {
        itemMeta.type = 'menu';
      }
      itemMeta.path = (menuMeta.path || menu.name || 'menu')
        + '-' + menuItem.name;
      renderer
        .startTag('li', {class: 'menu-' + itemMeta.path})
        .startTag('a', {href: menuItem.href})
        .write(menuItem.title)
        .shape(menuItem)
        .endTag()
        .endTag()
        .finally(next);
    },
    function doneEnumeratingMenuItems() {
      renderer
        .endTag()
        .finally(done);
    });
}

module.exports = menuTemplate;