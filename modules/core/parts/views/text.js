// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var html = require('htmlencode');

module.exports = function textTemplate(textPart, renderer, done) {
  switch(textPart.flavor) {
    case 'plain-text':
      var rendered = html
        .htmlEncode(textPart.text)
        .replace('&#13;&#10;', '<br/>\r\n');
      renderer
        .write(rendered)
        .finally(done);
      break;
    case 'html':
      renderer
        .write(textPart.text)
        .finally(done);
      break;
    default:
      var flavorHandlers = renderer.scope.getServices('text-flavor');
      for (var i = 0; i < flavorHandlers.length; i++) {
        if (flavorHandlers[i].matches(textPart.flavor)) {
          renderer
            .write(flavorHandlers[i].getHtml(textPart.text))
            .finally(done);
          return;
        }
      }
      done();
  }
};