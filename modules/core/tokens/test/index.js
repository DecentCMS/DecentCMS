// decentcms (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

var Shell = require('../../multi-tenancy/lib/shell');
var shell = new Shell({
  services: {
    token: [require('../lib/token')]
  }
});

describe('Token', function() {
  it('will leave literal strings alone', function() {
    var str = 'Hi, I\'m a string.';
    var token = shell.require('token');
    expect(token.interpolate(str, {foo:42}))
      .to.equal(str);
  });

  it('will evaluate tokens', function() {
    var str = 'A string with tokens in it: {{foo}} and {{bar}}.';
    var token = shell.require('token');
    expect(token.interpolate(str, {foo:42, bar: 'baz'}))
      .to.equal('A string with tokens in it: 42 and baz.');
  });

  it('will use pipes in tokens', function() {
    var str = 'A string with a piped token in it: {{foo|times>5}}.';
    shell.on(shell.services.token[0].registerPipesEvent, function(pipes) {
      pipes.times = function(str, n) {
        return new Array(parseInt(n || 1) + 1).join(str)
      }
    });
    var token = shell.require('token');
    expect(token.interpolate(str, {foo:42}))
      .to.equal('A string with a piped token in it: 4242424242.');
  });
});