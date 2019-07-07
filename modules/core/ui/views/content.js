// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function contentTemplate(content, renderer, done) {
  renderer
    .startTag('article')
    .zone({name: 'header', shape: content, tag: 'header'})
    .zone({name: 'main', shape: content})
    .zone({name: 'footer', shape: content, tag: 'footer'})
    .endTag()
    .finally(done);
}

module.exports = contentTemplate;