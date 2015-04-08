// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function contentTemplate(content, renderer, done) {
  renderer
    .startTag('article')
    .shape({shape: content.header, tag: 'header'})
    .shape({shape: content.main})
    .shape({shape: content.footer, tag: 'footer'})
    .endTag()
    .finally(done);
}

module.exports = contentTemplate;