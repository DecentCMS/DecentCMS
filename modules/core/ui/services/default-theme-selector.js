// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * The default theme selector picks the theme that is configured in site settings.
 *
 * An example of site settings that picks the default theme is:
 *
 *    "default-theme-selector": {
 *      "theme": "decent-theme-default"
 *    }
 *
 * The name specified in the settings must be the technical name of the theme as
 * specified in the theme's manifest (`package.json` file at the root of the theme.
 *
 * @param {object} scope The scope.
 * @constructor
 */
function DefaultThemeSelector(scope) {
  this.scope = scope;
}
DefaultThemeSelector.service = 'theme-selector';
DefaultThemeSelector.feature = 'default-theme-selector';
DefaultThemeSelector.scope = 'shell';
DefaultThemeSelector.isScopeSingleton = true;

/**
 * Looks at a theme's manifest and determines whether it should be active for the
 * current request, by comparing its name with the one configured in site settings.
 * @param {object} moduleManifest The module's manifest.
 * @returns {boolean} True if the theme should be active.
 */
DefaultThemeSelector.prototype.isThemeActive = function isThemeActive(moduleManifest) {
  var shell = this.scope.require('shell');
  var tenantTheme = shell.settings[DefaultThemeSelector.feature].theme;
  return tenantTheme && moduleManifest.name === tenantTheme;
};

module.exports = DefaultThemeSelector;