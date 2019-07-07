// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

const expect = require('chai').expect;
const shapeHelper = require('../services/shape');

describe('Shape', () => {
  it('can get and create meta', () => {
    const shape = {};
    const meta = shapeHelper.meta(shape);
    meta.foo = 42;

    expect(shape.meta.foo)
      .to.equal(42);
    expect(shapeHelper.meta(shape).foo)
      .to.equal(42);
  });

  it('can get and create alternate list', () => {
    const shape = {};
    const alternates = shapeHelper.alternates(shape);

    expect(Array.isArray(alternates)).to.be.true;
  });

  it('can get and create temp', () => {
    const shape = {};
    const temp = shapeHelper.temp(shape);
    temp.foo = 42;

    expect(shape.temp.foo)
      .to.equal(42);
    expect(shapeHelper.temp(shape).foo)
      .to.equal(42);
  });

  it('can parse order strings', () => {
    const orderString = "1.42.after.1";
    const parsed = shapeHelper.parseOrder(orderString);

    expect(parsed)
      .to.deep.equal([1, 42, 'after', 1]);
  });

  it('parses null or empty strings into an empty array', () => {
    expect(shapeHelper.parseOrder(null))
      .to.deep.equal([]);
    expect(shapeHelper.parseOrder(''))
      .to.deep.equal([]);
  });

  it('inserts a shape in order', () => {
    const shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2]}, id: 3},
      {meta: {order: [3]}, id: 4}
    ];

    const shape = {id: 5};
    shapeHelper.insert(shapes, shape, '1.1.3');
    expect(shapes.indexOf(shape)).to.equal(1);
    expect(shape.meta.order).to.deep.equal([1, 1, 3]);
  });

  it('inserts a shape with the same order as another after it.', () => {
    const shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2]}, id: 3},
      {meta: {order: [3]}, id: 4}
    ];

    const shape = {id: 5};
    shapeHelper.insert(shapes, shape, '1.2');
    expect(shapes.indexOf(shape)).to.equal(2);
  });

  it('inserts shapes with no order at the end', () => {
    const shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2]}, id: 3},
      {meta: {order: [3]}, id: 4}
    ];

    const shape = {id: 5};
    shapeHelper.insert(shapes, shape);
    expect(shapes.indexOf(shape)).to.equal(4);
  });

  it('inserts shapes with before before', () => {
    const shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2, 1]}, id: 3},
      {meta: {order: [2, 2]}, id: 4},
      {meta: {order: [3]}, id: 5}
    ];

    const shape6 = {id: 6};
    shapeHelper.insert(shapes, shape6, '2.before');
    expect(shapes.indexOf(shape6)).to.equal(2);

    const shape7 = {id: 7};
    shapeHelper.insert(shapes, shape7, '2.before');
    expect(shapes.indexOf(shape7)).to.equal(2);
    expect(shapes.indexOf(shape6)).to.equal(3);

    const shape8 = {id: 7};
    shapeHelper.insert(shapes, shape8, '2.0');
    expect(shapes.indexOf(shape8)).to.equal(4);
  });

  it('inserts shapes with after after', () => {
    const shapes = [
      {meta: {order: [1, 1]}, id: 1},
      {meta: {order: [1, 2]}, id: 2},
      {meta: {order: [2, 1]}, id: 3},
      {meta: {order: [2, 2]}, id: 4},
      {meta: {order: [3]}, id: 5}
    ];

    const shape6 = {id: 6};
    shapeHelper.insert(shapes, shape6, '2.after');
    expect(shapes.indexOf(shape6)).to.equal(4);

    const shape7 = {id: 7};
    shapeHelper.insert(shapes, shape7, '2.after');
    expect(shapes.indexOf(shape7)).to.equal(5);
    expect(shapes.indexOf(shape6)).to.equal(4);

    const shape8 = {id: 8};
    shapeHelper.insert(shapes, shape8, '2.3');
    expect(shapes.indexOf(shape8)).to.equal(4);
    expect(shapes.indexOf(shape6)).to.equal(5);
    expect(shapes.indexOf(shape7)).to.equal(6);
  });

  it('places shapes into deep trees', () => {
    const layout = {};
    const shape1 = {id: 1};
    shapeHelper.place(layout, 'content/foo/bar', shape1, '1');

    expect(layout.zones.content.zones.foo.zones.bar.temp.items)
      .to.deep.equal([shape1]);

    const shape2 = {id: 2};
    const shape3 = {id: 3};
    shapeHelper.place(layout, 'content/foo/baz', shape2, '1');
    shapeHelper.place(layout, 'content/foo/baz', shape3, 'before');

    expect(layout.zones.content.zones.foo.zones.bar.temp.items)
      .to.deep.equal([shape1]);
    expect(layout.zones.content.zones.foo.zones.baz.temp.items)
      .to.deep.equal([shape3, shape2]);
  });
});
