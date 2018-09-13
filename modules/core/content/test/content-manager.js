// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;

var ContentManager = require('../services/content-manager');

describe('Content Manager', function() {
  var cm = new ContentManager();
  var fooDefinition = {
    parts: {
      bar1: {type: 'part-bar'},
      bar2: {type: 'part-bar'},
      baz: {type: 'part-baz'},
      override1: {type: 'part-bar'},
      override2: {type: 'part-not-bar'}
    }
  };
  cm.scope = {
    settings: {
      content: {
        types: {
          foo: fooDefinition
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

  it('can infer the type name for an item', function() {
    var typeName = cm.getTypeName({
      meta: {type: 'foo'}
    });

    expect(typeName).to.equal('foo');
  });

  it('can infer the type definition for an item', function() {
    var typeDefinition = cm.getType({
      meta: {type: 'foo'}
    });

    expect(typeDefinition)
      .to.equal(fooDefinition);
  });

  it('can find the names of the parts that are of a specific type', function() {
    var barParts = cm.getPartNames(foo, 'part-bar');

    expect(barParts.sort()).to.deep.equal([
      'bar1',
      'bar2',
      'bart',
      'override2'
      ]);
  });

  it('can find the names of all the parts', function() {
    var barParts = cm.getPartNames(foo);

    expect(barParts.sort()).to.deep.equal([
      'bar1',
      'bar2',
      'bart',
      'baz',
      'notbar',
      'override1',
      'override2'
      ]);
  });

  it('can find the parts that are of a specific type', function() {
    var barParts = cm.getParts(foo, 'part-bar');

    expect(barParts.length).to.equal(4);
    expect(barParts).to.contain(foo.bar1);
    expect(barParts).to.contain(foo.bar2);
    expect(barParts).to.contain(foo.bart);
    expect(barParts).to.contain(foo.override2);
  });

  it('can find all the non-null parts', function() {
    var barParts = cm.getParts(foo);

    expect(barParts.length).to.equal(6);
    expect(barParts).to.contain(foo.bar1);
    expect(barParts).to.contain(foo.bar2);
    expect(barParts).to.contain(foo.bart);
    expect(barParts).to.contain(foo.notbar);
    expect(barParts).to.contain(foo.override1);
    expect(barParts).to.contain(foo.override2);
  });

  it('can find the types of parts', function() {
    var typeDefinition = cm.getType(foo);

    expect(cm.getPartType(foo, 'bar1')).to.equal('part-bar');
    expect(cm.getPartType(foo, 'bar2')).to.equal('part-bar');
    expect(cm.getPartType(foo, 'baz')).to.equal('part-baz');
    expect(cm.getPartType(foo, 'bart')).to.equal('part-bar');
    expect(cm.getPartType(foo, 'notbar')).to.equal('part-not-bar');
    expect(cm.getPartType(foo, 'override1')).to.equal('part-not-bar');
    expect(cm.getPartType(foo, 'override2')).to.equal('part-bar');
  });
});