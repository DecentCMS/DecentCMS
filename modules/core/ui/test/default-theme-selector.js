// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

describe('Default Theme Selector', function() {
  it('selects the theme from shell settings', function() {
    var scope = {
      require: function() {return {settings: {'default-theme-selector': {theme: 'foo'}}};}
    };
    var DefaultThemeSelector = require('../services/default-theme-selector');
    var themeSelector = new DefaultThemeSelector(scope);
    var isThemeActive = themeSelector.isThemeActive({name: 'foo'});

    expect(isThemeActive).to.be.true;
  });
});
