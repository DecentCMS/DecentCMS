// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

var Logger = require('../services/winston-logger');

describe('Winston Logger', function() {
  var scope = {
    settings: {
      logging: {
        Memory: {
          level: 'verbose',
          handleExceptions: true
        },
        exitOnError: false
      }
    },
    require: function(serviceName) {
      if (serviceName === 'localization') {
        return function(s) {return '[' + s + ']';}
      }
    }
  };
  var logger = new Logger(scope);

  function reset() {
    logger.logger.transports.memory.writeOutput = [];
    logger.logger.transports.memory.errorOutput = [];
    logger.logger.transports.memory.level = 'verbose';
  }

  it('gets its configuration from scope settings', function() {
    expect(logger.logger.transports.memory.level)
      .to.equal('verbose');
  });

  it('can log localized messages', function() {
    reset();
    logger.log('info', 'test', {foo: 'bar'});
    expect(logger.logger.transports.memory.writeOutput)
      .to.deep.equal(['info: info [test] foo=bar']);
  });

  it('can log verbose-level messages', function() {
    reset();
    logger.verbose('test', {foo: 'bar'});
    expect(logger.logger.transports.memory.writeOutput)
      .to.deep.equal(['verbose: [test] foo=bar']);
  });

  it('can log debug-level messages', function() {
    reset();
    logger.logger.transports.memory.level = 'debug';
    logger.debug('test', {foo: 'bar'});
    expect(logger.logger.transports.memory.errorOutput)
      .to.deep.equal(['debug: [test] foo=bar']);
  });

  it('can log info messages', function() {
    reset();
    logger.info('test', {foo: 'bar'});
    expect(logger.logger.transports.memory.writeOutput)
      .to.deep.equal(['info: [test] foo=bar']);
  });

  it('can log warning messages', function() {
    reset();
    logger.warn('test', {foo: 'bar'});
    expect(logger.logger.transports.memory.writeOutput)
      .to.deep.equal(['warn: [test] foo=bar']);
  });

  it('can log errors', function() {
    reset();
    logger.logger.transports.memory.level = 'error';
    logger.error('test', {foo: 'bar'});
    expect(logger.logger.transports.memory.errorOutput)
      .to.deep.equal(['error: [test] foo=bar']);
  });

  it("won't log messages under the transport level", function() {
    reset();
    logger.logger.transports.memory.level = 'error';
    logger.info('test', {foo: 'bar'});
    expect(logger.logger.transports.memory.errorOutput)
      .to.be.empty;
  });

  it('can log exceptions', function() {
    reset();
    // Distract the test runner's exception handler while we
    // trigger an exception that we don't want it to notice.
    var listeners = process.listeners('uncaughtException');
    var testRunnerListener = listeners.filter(function(listener) {
      return listener.name === 'uncaught';
    })[0];
    process.removeListener('uncaughtException', testRunnerListener);
    // Let Winston catch and log the exception.
    process.emit('uncaughtException', new Error('voluntary exception'));
    // Put the test runner's listener back in place.
    process.addListener('uncaughtException', testRunnerListener);

    expect(logger.logger.transports.memory.errorOutput[0].substr(0, 45))
      .to.equal('error: uncaughtException: voluntary exception');
  });
});