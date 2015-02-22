// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function urlTemplate(urlPart, renderer, done) {
  renderer
    .tag('a', {href: urlPart.url}, urlPart.text || urlPart.url)
    .finally(done);
};