// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function notFoundTemplate(notFound, renderer, done) {
  renderer
    .tag('h1', null, renderer.title)
    .finally(done);
};