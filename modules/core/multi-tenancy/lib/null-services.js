// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * Exposes trivial implementations of common services so
 * there is a reasonable fallback if no service of that
 * type is registered.
 */
var nullServices = {
  localization: function(s) {return s;}
};

module.exports = nullServices;