// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: querying the logs

/**
 * @description
 * A logging service that uses Winston.
 * @constructor
 */
function WinstonLogger(scope) {
  var winston = require('winston');

  var self = this;
  self.scope = scope;
  var t = scope.require('localization');

  // Obtain transports and their settings from shell settings
  var settings = scope.settings[WinstonLogger.feature] || {
    Console: {}
  };
  var transports = [];
  for (var transportName in settings) {
    var setting = settings[transportName];
    if (typeof(setting) === 'object') {
      transports.push(
        new (winston.transports[transportName])(setting)
      );
      delete settings[transportName];
    }
  }
  settings.transports = transports;
  var logger = self.logger = new (winston.Logger)(settings);

  /**
   * Logs a message at the verbose level.
   * The first parameter is localizable.
   * @param {string} msg The message.
   * @param {object} [meta]
   * An object to dump along with the message in order to give more information.
   */
  this.verbose = function() {
    arguments[0] = t(arguments[0]);
    logger.verbose.apply(logger, arguments);
  };

  /**
   * Logs a message at the debug level.
   * The first parameter is localizable.
   * @param {string} msg The message.
   * @param {object} [meta]
   * An object to dump along with the message in order to give more information.
   */
  this.debug = function() {
    arguments[0] = t(arguments[0]);
    logger.debug.apply(logger, arguments);
  };

  /**
   * Logs a message at the info level.
   * The first parameter is localizable.
   * @param {string} msg The message.
   * @param {object} [meta]
   * An object to dump along with the message in order to give more information.
   */
  this.info = function() {
    arguments[0] = t(arguments[0]);
    logger.info.apply(logger, arguments);
  };

  /**
   * Logs a message at the warn level.
   * The first parameter is localizable.
   * @param {string} msg The message.
   * @param {object} [meta]
   * An object to dump along with the message in order to give more information.
   */
  this.warn = function() {
    arguments[0] = t(arguments[0]);
    logger.warn.apply(logger, arguments);
  };

  /**
   * Logs a message at the error level.
   * The first parameter is localizable.
   * @param {string} msg The message.
   * @param {object} [meta]
   * An object to dump along with the message in order to give more information.
   */
  this.error = function() {
    arguments[0] = t(arguments[0]);
    logger.error.apply(logger, arguments);
  };

  /**
   * Logs a message.
   * @param {string} level
   * The level of the message, chosen between verbose, debug, info, warn, and error.
   * @param {string} msg The message.
   * @param {object} [meta]
   * An object to dump along with the message in order to give more information.
   * @param {Function} [callback] An optional callback.
   */
  this.log = function(level, msg, meta, callback) {
    arguments[1] = t(msg);
    logger[level].apply(logger, arguments);
  };

  /**
   * A simple profiling mechanism, functioning like a stopwatch.
   * Call it once to start the timer, and call it a second time with the same
   * id to stop the watch and log the time between the two calls.
   * @param {string} id The watch id.
   * @param {object} [metadata] Metadata to log along with the time taken.
   */
  this.profile = function() {
    logger.profile.apply(logger, arguments);
  };
}

WinstonLogger.feature = 'winston-logger';
WinstonLogger.service = 'log';
WinstonLogger.scope = 'shell';
WinstonLogger.isScopeSingleton = true;

module.exports = WinstonLogger;