// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

var Logger = require('../services/winston-logger');
var Writable = require('stream').Writable;

var memoryStream = new Writable({
  write: function writeToMemory(chunk, encoding, callback) {
    this._buffer.push(chunk);
    callback();
  }
});
(memoryStream.reset = function resetMemoryStream() {memoryStream._buffer = [];})();
memoryStream.getAll = function getAllMemoryStream(separator) {return memoryStream._buffer.join(separator || '|')};
memoryStream.deserialize = function deserialize() {return memoryStream._buffer.map(s => JSON.parse(s));};

describe('Winston Logger', function() {
  var scope = {
    settings: {
      'winston-logger': {
        Stream: {
          level: 'verbose',
          handleExceptions: true,
          stream: memoryStream
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
    memoryStream.reset();
  }

  it('gets its configuration from scope settings', function() {
    expect(logger.transports[0].level)
      .to.equal('verbose');
  });

  it('can log localized messages', function() {
    reset();
    logger.log('info', 'test', {foo: 'bar'});
    expect(memoryStream.deserialize()[0])
      .to.deep.equal({level: 'info', message: '[test]', foo: 'bar'});
  });

  it('can log verbose-level messages', function() {
    reset();
    logger.verbose('test', {foo: 'bar'});
    expect(memoryStream.deserialize()[0])
      .to.deep.equal({level: 'verbose', message: '[test]', foo: 'bar'});
  });

  it('can log debug-level messages', function() {
    reset();
    logger.logger.transports[0].level = 'debug';
    logger.debug('test', {foo: 'bar'});
    expect(memoryStream.deserialize()[0])
      .to.deep.equal({level: 'debug', message: '[test]', foo: 'bar'});
  });

  it('can log info messages', function() {
    reset();
    logger.info('test', {foo: 'bar'});
    expect(memoryStream.deserialize()[0])
      .to.deep.equal({level: 'info', message: '[test]', foo: 'bar'});
  });

  it('can log warning messages', function() {
    reset();
    logger.warn('test', {foo: 'bar'});
    expect(memoryStream.deserialize()[0])
      .to.deep.equal({level: 'warn', message: '[test]', foo: 'bar'});
  });

  it('can log errors', function() {
    reset();
    logger.logger.transports[0].level = 'error';
    logger.error('test', {foo: 'bar'});
    expect(memoryStream.deserialize()[0])
      .to.deep.equal({level: 'error', message: '[test]', foo: 'bar'});
  });

  it("won't log messages under the transport level", function() {
    reset();
    logger.logger.transports[0].level = 'error';
    logger.info('test', {foo: 'bar'});
    expect(memoryStream.deserialize())
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

    expect(memoryStream.deserialize()[0].message.substr(0, 38))
      .to.equal('uncaughtException: voluntary exception');
  });
});