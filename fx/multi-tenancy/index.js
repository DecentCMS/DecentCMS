// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';
var Shell = require('./lib/shell');
var moduleDiscovery = require('./lib/module-discovery');

module.exports = {
  Shell: Shell,
  discover: moduleDiscovery.discover,
  modules: moduleDiscovery.modules
};