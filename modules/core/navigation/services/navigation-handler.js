// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var async = require('async');

function NavigationHandler(scope) {
  this.scope = scope;
}
NavigationHandler.feature = 'navigation';
NavigationHandler.scope = 'request';

NavigationHandler.prototype.placeShapes = function placeNavigation(options, done) {
  var layout = options.shape;
  if (!layout.meta || layout.meta.type !== 'layout') return;
  var navigationProviders = this.scope.getServices('navigation-provider');
};

module.exports = NavigationHandler;