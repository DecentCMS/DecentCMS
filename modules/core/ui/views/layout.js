// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function layoutTemplate(layout, renderer, shell) {
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
    .renderScripts()

    .write('</body>');
};