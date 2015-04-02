// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var EventEmitter = require('events').EventEmitter;
var stream = require('stream');
var async = require('async');

var ContentManager = require('../services/content-manager');

describe('Content Manager', function() {

  it('can infer the type definition for a shape', function() {
    var cm = new ContentManager();
    var fooDefinition = {};
    cm.scope = {
      settings: {
        content: {
          types: {
            foo: fooDefinition
          }
        }
      }
    };

    var typeDefinition = cm.getType({
      meta: {type: 'foo'}
    });

    expect(typeDefinition)
      .to.equal(fooDefinition);
  });

  it('can find the parts that are of a specific type', function() {
    var cm = new ContentManager();
    cm.scope = {
      settings: {
        content: {
          types: {
            foo: {
              parts: {
                bar1: {type: 'part-bar'},
                bar2: {type: 'part-bar'},
                baz: {type: 'part-baz'},
                override1: {type: 'part-bar'},
                override2: {type: 'part-not-bar'}
              }
            }
          }
        }
      }
    };
    var foo = {
      meta: {type: 'foo'},
      bart: {meta: {type: 'part-bar'}},
      notbar: {meta: {type: 'part-not-bar'}},
      bar1: 'barre un',
      bar2: {meta: {type: 'part-bar'}},
      override1: {meta: {type: 'part-not-bar'}},
      override2: {meta: {type: 'part-bar'}}
    };

    var barParts = cm.getParts(foo, 'part-bar');

    expect(barParts.sort()).to.deep.equal([
      'bar1',
      'bar2',
      'bart',
      'override2'
      ]);
  });
});