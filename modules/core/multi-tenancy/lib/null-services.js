// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * Exposes trivial implementations of common services so
 * there is a reasonable fallback if no service of that
 * type is registered.
 */
var NullServices = {
  /**
   * A trivial localization service that returns the string unchanged.
   * @param {string} s The string to localize.
   * @returns {string} The unchanged string.
   */
  localization: function(s) {return s;},
  /**
   * A trivial log service that does nothing.
   */
  log: {
    log: function() {},
    verbose: function() {},
    debug: function() {},
    info: function() {},
    warn: function() {},
    error: function() {},
    profile: function() {}
  }
};

module.exports = NullServices;