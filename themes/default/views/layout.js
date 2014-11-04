// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function layoutTemplate(layout, renderer, shell) {
  // TODO: use tag API
  renderer
    .addMeta('generator', 'DecentCMS')
    .addStyleSheet('bootstrap')
    .addScript('bootstrap')

    .writeLine('<!DOCTYPE html>')
    .writeLine('<html>')
    .writeLine('<head>')

    .write('  <title>')
    .writeEncoded(renderer.title)
    .writeLine('</title>')

    .renderMeta()
    .renderStyleSheets()

    .writeLine('</head><body>');

  if (layout.main) {
    shell.emit('decent.core.shape.render', {
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

    .write('</body>');
};