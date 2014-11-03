// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function layoutTemplate(content, renderer, shell) {
  renderer.write('<article>');
  if (content.header) {
    renderer.write('<header>');
    // TODO: move that to a util method on the renderStream.
    shell.emit('decent.core.shape.render', {
      shape: content.header,
      renderStream: renderer
    });
    renderer.writeLine('</header>');
  }
  if (content.main) {
    shell.emit('decent.core.shape.render', {
      shape: content.main,
      renderStream: renderer
    });
  }
  if (content.footer) {
    renderer.write('<footer>');
    shell.emit('decent.core.shape.render', {
      shape: content.footer,
      renderStream: renderer
    });
    renderer.writeLine('</footer>');
  }
  renderer.writeLine('</article>');
};