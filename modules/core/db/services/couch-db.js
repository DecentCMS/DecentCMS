// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Used to get a CouchDB object for a given connection and database.
 */
function CouchDB(scope) {
  this.scope = scope;
}
CouchDB.feature = 'couch-db';
CouchDB.service = 'couch-db';
CouchDB.scope = 'shell';
/**
 * Gets a Couch object using the settings on the config object.
 * @param {object} config The configuration.
 * @param {string} config.connection The name of the connection to the CouchDB server to use. Must be one of the property names on the 'connections' property of the settings of the 'couch-db' feature.
 * @param {string} config.database The name of the database.
 * @returns {Couch} The configured Couch object.
 */
CouchDB.prototype.getCouch = function getCouch(config) {
  var shell = this.scope.require('shell');
  var databaseConnections = shell.settings[CouchDB.feature].connections;
  var connection = databaseConnections[config.connection];
  var Couch = require('../lib/couch');
  return new Couch(connection, config);
};

module.exports = CouchDB;