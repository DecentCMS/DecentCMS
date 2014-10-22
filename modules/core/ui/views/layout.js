// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function layoutTemplate(layout, renderer, shell) {
  renderer.write('<html><head><title>');
  renderer.writeEncoded(renderer.title);
  renderer.write('</title>');
  // TODO: render scripts and stylesheets
  renderer.write('</head><body>');
  if (layout.main) {
    shell.emit('decent.core.shape.render', {
      shape: layout.main,
      renderStream: renderer
    });
  }
  renderer.write('</body>');
};