// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function textTemplate(textPart, renderer, done) {
  renderer
        .write(textPart.html)
        .finally(done);
};