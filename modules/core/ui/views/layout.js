// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function layoutTemplate(layout, renderer, shell) {
  renderer.writeLine('<!DOCTYPE html>');
  renderer.writeLine('<html>');
  renderer.writeLine('<head>');
  renderer.write('  <title>');
  renderer.writeEncoded(renderer.title);
  renderer.writeLine('</title>');
  // TODO: render scripts and stylesheets
  renderer.writeLine('</head><body>');
  if (layout.main) {
    shell.emit('decent.core.shape.render', {
      shape: layout.main,
      renderStream: renderer
    });
  }
  renderer.write('</body>');
};