// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function titleTemplate(title, renderer) {
  renderer.startTag('h1');
  renderer.writeEncoded(title.text);
  renderer.endTag();
};