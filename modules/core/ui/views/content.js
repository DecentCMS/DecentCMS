// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function layoutTemplate(content, renderer, done) {
  renderer
    .startTag('article')
    .shape(content.header, 'header')
    .shape(content.main)
    .shape(content.footer, 'footer')
    .endTag()
    .finally(done);
}

module.exports = layoutTemplate;