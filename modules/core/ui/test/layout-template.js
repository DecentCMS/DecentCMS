// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

const expect = require('chai').expect;
const EventEmitter = require('events').EventEmitter;
const RenderStream = require('../services/render-stream');

describe('Layout Template', () => {
  it('renders scripts, stylesheets, metas, body', done => {
    const scope = new EventEmitter();
    const renderer = new RenderStream(scope);
    let result = '';
    renderer.on('data', data => result += data);
    renderer.title = 'Foo';
    renderer.scripts = ['script.js'];
    renderer.stylesheets = ['style.css'];
    renderer.addMeta('generator', 'DecentCMS');
    // Only one service method is being used in this code path: render from rendering-strategy services
    scope.callService = (service, method, options, next) =>
      options.renderStream.write('[' + options.shape.name + ']').finally(next);

    const layout = { zones: { main: {name: 'main'} } };
    const layoutView = require('../views/layout');

    layoutView(layout, renderer, () => {
      expect(result)
        .to.equal(
        '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
        '<title>Foo</title>' +
        '<meta name="generator" content="DecentCMS"/>' +
        '<link href="style.css" rel="stylesheet" type="text/css"/>' +
        '</head>' +
        '<body>[main]' +
        '<script src="script.js" type="text/javascript"></script>' +
        '</body></html>');
      done();
    });
  });
});
