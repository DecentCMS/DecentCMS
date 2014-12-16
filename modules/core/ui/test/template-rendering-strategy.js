// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;
var shapeHelper = require('../services/shape');
var TemplateRenderingStrategy =
      require('../services/template-rendering-strategy');

describe('Template Rendering Strategy', function() {
  var viewEngine1 = {
    load: function (templatePath, templateLoaded) {
      templateLoaded(function (shape, renderer, done) {
        renderer.write('[ve1:' + shape.meta.type + ':' + templatePath + ']');
        done();
      });
    },
    extension: 've1'
  };
  var viewEngine2 = {
    load: function (templatePath, templateLoaded) {
      templateLoaded(function (shape, renderer, done) {
        renderer.write('[ve2:' + shape.meta.type + ':' + templatePath + ']');
        done();
      });
    },
    extension: 've2'
  };
  var fileResolver = {
    resolve: function (folder, file) {
      if (file.source === 'zone\\.(ve1|ve2)') return 'path/to/zone.ve1';
      return 'template.ve2';
    }
  };
  var renderer = new require('stream').PassThrough();
  renderer.on('data', function (chunk) {
    html.push(chunk.toString());
  });
  var scope, templateRenderingStrategy, html;

  beforeEach(function () {
    scope = new EventEmitter();
    scope.require = function (service) {
      switch (service) {
        case 'file-resolution':
          return fileResolver;
        case 'shape':
          return shapeHelper;
      }
    };
    scope.getServices = function (service) {
      if (service === 'view-engine') return [viewEngine1, viewEngine2];
    };
    templateRenderingStrategy = new TemplateRenderingStrategy(scope);
    html = [];
  });

  it('selects a view engine based on the template it finds', function (done) {
    templateRenderingStrategy.render({
      shape: {meta: {type: 'shape1'}},
      renderStream: renderer
    }, function () {
      expect(html.join(''))
        .to.equal('[ve2:shape1:template.ve2]');
      done();
    });
  });

  it('renders an untyped shape as a zone', function (done) {
    templateRenderingStrategy.render({
      shape: {},
      renderStream: renderer
    }, function () {
      expect(html.join(''))
        .to.equal('[ve1:zone:path/to/zone.ve1]');
      done();
    });
  });

  it('renders a shape with temp.html directly without template', function (done) {
    templateRenderingStrategy.render({
      shape: {temp: {html: 'some html'}},
      renderStream: renderer
    }, function () {
      expect(html.join(''))
        .to.equal('some html')
      done();
    });
  });
});
