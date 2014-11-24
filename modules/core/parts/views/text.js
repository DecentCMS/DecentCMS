// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var html = require('htmlencode');

module.exports = function textTemplate(textPart, renderer, scope) {
  switch(textPart.flavor) {
    case 'plain-text':
      var rendered = html
        .htmlEncode(textPart.text)
        .replace('&#13;&#10;', '<br/>\r\n');
      renderer.write(rendered);
      break;
    case 'html':
      renderer.write(textPart.text);
      break;
    default:
      var flavorHandlers = scope.getServices('text-flavor');
      for (var i = 0; i < flavorHandlers.length; i++) {
        if (flavorHandlers[i].matches(textPart.flavor)) {
          renderer.write(flavorHandlers[i].getHtml(textPart.text));
          break;
        }
      }
  }
};