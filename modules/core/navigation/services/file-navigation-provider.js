// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var fs = require('fs');
var path = require('path');

/**
 * @description
 * Builds menu items from JSON files.
 * @param {object} scope The scope.
 * @constructor
 */
function FileNavigationProvider(scope) {
  this.scope = scope;
}
FileNavigationProvider.service = 'navigation-provider';
FileNavigationProvider.feature = 'file-navigation-provider';
FileNavigationProvider.isScopeSingleton = true;
FileNavigationProvider.scope = 'shell';

/**
 * @description
 * Adds navigation items for a menu.
 * @param {string} [context.menu] The name of the menu.
 * @param {Array}  [context.items] The array of menu top-level items.
 * @param {Function} done The callback function.
 */
FileNavigationProvider.prototype.addRootItems = function addRootItems(context, done) {
  var menu = context.menu || 'default';
  var items = context.items || [];
  var navigationDataRoot = path.join(this.scope.rootPath, 'navigation');
  var navigationFile = menu + '.json';
  var navigationFilePath = path.join(navigationDataRoot, navigationFile);
  fs.readFile(navigationFilePath, function navigationFileRead(err, data) {
    if (err) {done(err);return;}
    var newItems = JSON.parse(data);
    Array.prototype.push.apply(items, newItems);
    done();
  });
};

module.exports = FileNavigationProvider;