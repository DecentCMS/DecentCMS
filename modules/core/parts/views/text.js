// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var html = require('htmlencode');

module.exports = function textTemplate(textPart, renderer, shell) {
  switch(textPart.flavor) {
    case 'plain-text':
      var html = html.htmlEncode(textPart.text).replace('\r\n', '<br/>\r\n');
      renderer.write(html);
      break;
    case 'html':
      renderer.write(textPart.text);
      break;
    default:
      var flavorHandlers = shell.getServices('text-flavor');
      for (var i = 0; i < flavorHandlers.length; i++) {
        if (flavorHandlers[i].matches(textPart.flavor)) {
          renderer.write(flavorHandlers[i].getHtml(textPart.text));
          break;
        }
      }
  }
};