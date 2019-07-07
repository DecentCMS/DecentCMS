// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * A service that queries navigation providers and caches results at the site level.
 * @param {object} scope The scope.
 * @constructor
 */
class Navigation {
  constructor(scope) {
    this.scope = scope;
  }
  /**
   * Queries navigation providers to build a menu's items.
   * @param {object} context The context.
   * @param {string} context.menu The menu to build items for.
   * @param {Array} context.items The list of items is set here by the service.
   * @param {Function} done The callback.
   */
  query(context, done) {
    const site = this.scope.require('shell');
    // Check for a cached menu
    const menus = site.navigation || (site.navigation = {});
    const menu = menus[context.menu];
    if (menu) {
      context.items = menu;
      done();
    }
    else {
      menus[context.menu] = context.items || (context.items = []);
      // Query the providers for items
      this.scope.callService('navigation-provider', 'addRootItems', { menu, items: context.items }, done);
    }
  }
}
Navigation.feature = 'navigation';
Navigation.service = 'navigation-service';
Navigation.scope = 'shell';

module.exports = Navigation;