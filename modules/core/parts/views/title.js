// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function titleTemplate(title, renderer, done) {
  renderer
    .tag('h1', null, title.text)
    .finally(done);
};