// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function layoutTemplate(content, renderer, scope) {
  renderer.write('<article>');
  if (content.header) {
    renderer.write('<header>');
    // TODO: move that to a util method on the renderStream.
    scope.emit('decent.core.shape.render', {
      shape: content.header,
      renderStream: renderer
    });
    renderer.writeLine('</header>');
  }
  if (content.main) {
    scope.emit('decent.core.shape.render', {
      shape: content.main,
      renderStream: renderer
    });
  }
  if (content.footer) {
    renderer.write('<footer>');
    scope.emit('decent.core.shape.render', {
      shape: content.footer,
      renderStream: renderer
    });
    renderer.writeLine('</footer>');
  }
  renderer.writeLine('</article>');
}

module.exports = layoutTemplate;