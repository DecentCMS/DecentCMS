// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var async = require('async');

function NavigationHandler(scope) {
  this.scope = scope;
}
NavigationHandler.feature = 'navigation';
NavigationHandler.service = 'shape-handler';
NavigationHandler.scope = 'request';

NavigationHandler.prototype.handle = function handleNavigation(context, done) {
  var layout = context.shape;
  if (!layout.meta || layout.meta.type !== 'layout') return done();
  var scope = this.scope;
  var navigationContext = {
    menu: 'default',
    items: []
  };
  this.scope.callService('navigation-provider', 'addRootItems', navigationContext, function() {
    var site = scope.require('shell');
    var current = scope.url;
    var shapeHelper = scope.require('shape');
    shapeHelper.place(layout, 'navigation', {
      meta: {type: 'menu'},
      site: site,
      name: navigationContext.menu,
      items: navigationContext.items,
      current: current
    }, 'after');
    done();
  });
};

module.exports = NavigationHandler;