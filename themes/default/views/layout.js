// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function layoutTemplate(layout, renderer, shell) {
  renderer.addMeta('generator', 'DecentCMS');
  renderer.addStyleSheet('bootstrap');
  renderer.addScript('bootstrap');

  renderer.writeLine('<!DOCTYPE html>');
  renderer.writeLine('<html>');
  renderer.writeLine('<head>');
  renderer.write('  <title>');
  renderer.writeEncoded(renderer.title);
  renderer.writeLine('</title>');
  renderer.renderMeta();
  renderer.renderStyleSheets();
  renderer.writeLine('</head><body>');
  if (layout.main) {
    shell.emit('decent.core.shape.render', {
      shape: layout.main,
      renderStream: renderer
    });
  }
  renderer.br();
  renderer.writeEncodedLine('This is the default theme.');
  renderer.br();
  renderer.tag('img', {
    src: '/img/glyphicons-halflings.png',
    alt: 'Glyphs'
  });
  renderer.writeLine();

  renderer.renderScripts();
  renderer.write('</body>');
};