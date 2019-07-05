// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function layoutTemplate(layout, renderer, done) {
  renderer
    .doctype()
    .writeLine()
    .startTag('html')
    .writeLine()
    .startTag('head')
    .writeLine()

    .tag('title', {}, renderer.title)
    .writeLine()

    .renderMeta()
    .renderStyleSheets()

    .endTag()
    .writeLine()
    .startTag('body')
    .zone({shape: layout, zone: 'navigation'})
    .zone({shape: layout, zone: 'main'})
    .writeLine()

    .renderScripts()

    .endAllTags()
    .finally(done);
};