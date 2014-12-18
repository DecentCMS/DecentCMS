// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');
var EventEmitter = require('events').EventEmitter;
var shell = new EventEmitter();
var Token = require('../services/token');

describe('Token', function() {
  it('will leave literal strings alone', function() {
    var str = 'Hi, I\'m a string.';
    var token = new Token(shell);
    expect(token.interpolate(str, {foo:42}))
      .to.equal(str);
  });

  it('will evaluate tokens', function() {
    var str = 'A string with tokens in it: {{foo}} and {{bar}}.';
    var token = new Token(shell);
    expect(token.interpolate(str, {foo:42, bar: 'baz'}))
      .to.equal('A string with tokens in it: 42 and baz.');
  });

  it('will use pipes in tokens', function() {
    var str = 'A string with a piped token in it: {{foo|times>5}}.';
    shell.on(Token.registerPipesEvent, function(pipes) {
      pipes.times = function(str, n) {
        return new Array(parseInt(n || 1) + 1).join(str)
      }
    });
    var token = new Token(shell);
    expect(token.interpolate(str, {foo:42}))
      .to.equal('A string with a piped token in it: 4242424242.');
  });
});

describe('Markup View Engine', function() {
  var shell = new EventEmitter();
  shell.require = function(service) {
    return service === 'token' ? new Token(shell) : null;
  };
  var readFile = function(path, done) {
    done(null, path);
  };
  readFile['@noCallThru'] = true;
  var ViewEngine = proxyquire('../services/markup-view-engine', {
    fs: {
      readFile: readFile
    }
  });
  var viewEngine = new ViewEngine(shell);
  var html = [];
  var renderer = new require('stream').PassThrough();
  renderer.on('data', function(chunk) {
    html.push(chunk);
  });

  it('compiles templates', function(done) {
    html  = [];
    viewEngine.load('Foo: {{foo}}, Bar: {{bar}}, Baz: {{baz}}', function(compiled) {
      compiled({foo: 'foo', bar: 'bar', baz: 42}, renderer, function() {
        expect(html.join(''))
          .to.equal('Foo: foo, Bar: bar, Baz: 42');
        done();
      });
    });
  });
});