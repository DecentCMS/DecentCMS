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
      switch(file.source) {
        case 'zone\\.(ve1|ve2)':
          return 'path/to/zone.ve1';
        case 'alternate1\\.(ve1|ve2)':
          return 'path/to/alternate1.ve1';
        case 'shape1\\.(ve1|ve2)':
          return 'template.ve2';
        default:
          return null;
      }
    }
  };
  var renderer = new (require('stream')).PassThrough();
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

  it("uses the shape name if one is provided", function (done) {
    templateRenderingStrategy.render({
      shape: {meta: {type: 'foo'}},
      shapeName: 'shape1',
      renderStream: renderer
    }, function () {
      expect(html.join(''))
        .to.equal('[ve2:foo:template.ve2]');
      done();
    });
  });

  it('uses alternates before the shape name', function (done) {
    templateRenderingStrategy.render({
      shape: {
        meta: {
          type: 'shape1',
          alternates: ['alternate1', 'alternate2']
        }
      },
      renderStream: renderer
    }, function () {
      expect(html.join(''))
        .to.equal('[ve1:shape1:path/to/alternate1.ve1]');
      done();
    });
  });

  it('resolves alternates in the order specified', function (done) {
    templateRenderingStrategy.render({
      shape: {
        meta: {
          type: 'shape1',
          alternates: ['alternate0', 'alternate1']
        }
      },
      renderStream: renderer
    }, function () {
      expect(html.join(''))
        .to.equal('[ve1:shape1:path/to/alternate1.ve1]');
      done();
    });
  });

  it('reverts to the shape name if no alternate is found', function (done) {
    templateRenderingStrategy.render({
      shape: {
        meta: {
          type: 'shape1',
          alternates: ['alternateA', 'alternateB']
        }
      },
      renderStream: renderer
    }, function () {
      expect(html.join(''))
        .to.equal('[ve2:shape1:template.ve2]');
      done();
    });
  });

  it('renders a shape with temp.html directly without template', function (done) {
    templateRenderingStrategy.render({
      shape: {temp: {html: 'some html'}},
      renderStream: renderer
    }, function () {
      expect(html.join(''))
        .to.equal('some html');
      done();
    });
  });
});
