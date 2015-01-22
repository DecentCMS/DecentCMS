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
                baz: {type: 'part-baz'}
              }
            }
          }
        }
      }
    };
    var foo = {meta: {type: 'foo'}};

    var barParts = cm.getParts(foo, 'part-bar');

    expect(barParts.indexOf('bar1')).to.not.equal(-1);
    expect(barParts.indexOf('bar2')).to.not.equal(-1);
    expect(barParts.indexOf('baz')).to.equal(-1);
  });
});