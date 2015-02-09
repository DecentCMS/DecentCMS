// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var parser = require('../services/json-yaml-md-file-parser');

describe('JSON YAML MD File Parser', function() {
  it('parses JSON files', function(done) {
    var context = {
      path: 'path/to/some-file-to-test.json',
      data: '{"foo":"bar"}'
    };
    parser.parse(context, function() {
      expect(context.item.foo).to.equal('bar');
      done();
    });
  });

  it('parses YAML files', function(done) {
    var context = {
      path: 'path/to/some-file-to-test.yaml',
      data: 'foo: bar'
    };
    parser.parse(context, function() {
      expect(context.item.foo).to.equal('bar');
      done();
    });
  });

  it('parses YAML-Markdown snippable files', function(done) {
    var context = {
      path: 'path/to/some-file-to-test.yaml.md',
      data: 'foo: bar\r\n\r\n-8<------------\r\n\r\nSome *Markdown*'
    };
    parser.parse(context, function() {
      expect(context.item.foo).to.equal('bar');
      expect(context.item.body.flavor).to.equal('markdown');
      expect(context.item.body._data).to.equal('Some *Markdown*');
      done();
    });
  });
});