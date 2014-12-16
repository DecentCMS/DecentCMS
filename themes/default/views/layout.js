// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function layoutTemplate(layout, renderer, done) {
  renderer
    .addMeta('generator', 'DecentCMS')
    .addStyleSheet('bootstrap')
    .addScript('bootstrap')

    .doctype()
    .writeLine()
    .startTag('html')
    .writeLine()
    .startTag('head')
    .writeLine()

    .write('  ')
    .tag('title', {}, renderer.title)
    .writeLine()

    .renderMeta()
    .renderStyleSheets()

    .endTag()
    .writeLine()
    .startTag('body')

    .shape(layout.main)

    .writeLine()

    .renderScripts()

    .endAllTags()

    .finally(done);
};