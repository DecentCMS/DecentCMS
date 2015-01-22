// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function DefaultThemeSelector(scope) {
  this.scope = scope;
}
DefaultThemeSelector.service = 'theme-selector';
DefaultThemeSelector.scope = 'shell';
DefaultThemeSelector.isScopeSingleton = true;

DefaultThemeSelector.prototype.isThemeActive = function isThemeActive(moduleManifest) {
  var shell = this.scope.require('shell');
  var tenantTheme = shell.settings['default-theme-selector'].theme;
  return tenantTheme && moduleManifest.name === tenantTheme;
};

module.exports = DefaultThemeSelector;