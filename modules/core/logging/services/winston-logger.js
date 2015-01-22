// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: querying the logs

var winston = require('winston');

/**
 * @description
 * A logging service that uses Winston.
 * @constructor
 */
function WinstonLogger(scope) {
  var self = this;
  self.scope = scope;
  self.t = scope.require('localization');

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

  // Expose winston methods
  ['verbose','debug','info','warn','error']
    .forEach(function forEachMethod(name) {
      self[name] = function(msg) {
        arguments[0] = this.t(msg);
        logger[name].apply(logger, arguments);
      }
    });

  // log
  this.log = function(level, msg, meta, callback) {
    arguments[1] = self.t(msg);
    logger[level].apply(logger, arguments);
  };

  // profile
  this.profile = function(id) {
    logger.profile.apply(logger, arguments);
  };
}

WinstonLogger.feature = 'winston-logger';
WinstonLogger.service = 'log';
WinstonLogger.scope = 'shell';
WinstonLogger.isScopeSingleton = true;

module.exports = WinstonLogger;