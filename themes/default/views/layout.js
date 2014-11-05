// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function layoutTemplate(layout, renderer, scope) {
  renderer
    .addMeta('generator', 'DecentCMS')
    .addStyleSheet('bootstrap')
    .addScript('bootstrap')

    .doctype()
    .startTag('html')
    .startTag('head')

    .write('  ')
    .tag('title', {}, renderer.title)

    .renderMeta()
    .renderStyleSheets()

    .endTag()
    .startTag('body');

  if (layout.main) {
    scope.emit('decent.core.shape.render', {
      shape: layout.main,
      renderStream: renderer
    });
  }

  renderer
    .br()
    .writeEncodedLine('This is the default theme.')
    .br()
    .tag('img', {
      src: '/img/glyphicons-halflings.png',
      alt: 'Glyphs'
    })
    .writeLine()

    .renderScripts()

    .endAllTags();
};