// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

describe('Shape Item Promise Handler', function() {
  it('changes the promise shape into a content shape and runs a new rendering life cycle for the item', function(done) {
    var promiseShape = {
      meta: {type: 'shape-item-promise'},
      id: 'widget:bar'
    };
    var item = {id: 'widget:bar', meta: {type: 'foo'}};
    var context = {
      shape: promiseShape,
      renderStream: {},
      scope: {
        require: function(service) {
          switch(service) {
            case 'storage-manager':
              return {
                getAvailableItem: function () {
                  return item;
                }
              };
            case 'shape':
              return require('../services/shape');
          }
        },
        lifecycle: function() {
          return function(context, next) {
            expect(context.shape.temp.item).to.equal(item);
            next();
          }
        }
      }
    };
    var ShapeItemPromiseHandler = require('../services/shape-item-promise-handler');
    ShapeItemPromiseHandler.handle(context, function() {
      expect(context.shape.meta.type).to.equal('content');
      expect(context.shape.temp.item).to.equal(item);
      expect(context.shape.meta.alternates).to.deep.equal(['content-foo', 'content-widget']);
      done();
    });
  });
});
