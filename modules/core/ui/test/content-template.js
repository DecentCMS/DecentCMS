// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

const expect = require('chai').expect;
const EventEmitter = require('events').EventEmitter;
const RenderStream = require('../services/render-stream');

describe('Content Template', () => {
  const scope = new EventEmitter();
  const renderer = new RenderStream(scope);
  let result = '';
  renderer.on('data', function(data) {
    result += data;
  });
  scope.callService = function(service, method, options, next) {
    options.renderStream
      .write('[' + options.shape.meta.type + ']')
      .finally(next);
  };

  beforeEach(function reset() {
    result = '';
    renderer._pendingCount = false;
  });

  it('renders header, main zone, and footer', done => {
    const content = {
      zones: {
        header: {meta: {type: 'header'}},
        main: {meta: {type: 'main'}},
        footer: {meta: {type: 'footer'}}
      }
    };
    const contentView = require('../views/content');

    contentView(content, renderer, () => {
      expect(result)
        .to.equal(
        '<article>' +
        '<header>[header]</header>' +
        '[main]' +
        '<footer>[footer]</footer>' +
        '</article>');
      done();
    });
  });

  it("doesn't render header, main, or footer if they don't exist", done => {
    const content = {};
    const contentView = require('../views/content');

    contentView(content, renderer, () => {
      expect(result)
        .to.equal('<article></article>');
      done()
    });
  });
});
