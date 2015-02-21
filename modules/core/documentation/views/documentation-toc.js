// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function documentationTocTemplate(toc, renderer, done) {
  var showTopLevelTOC = !!toc.showTopLevelTOC;
  var showBreadcrumbs = !!toc.showBreadcrumbs;
  var showNextPrevious = !! toc.showNextPrevious;
  var t = renderer.scope.require('localization');
  renderer.startTag('nav', {class: 'toc'});
  if (showNextPrevious) {
    renderer.startTag('div', {class: 'previous-next'});
    if (toc.previous) {
      renderer.tag('a', {href: toc.previous.url, class: 'previous'}, t('&lt; previous'));
      if (toc.next) {
        renderer.write(t(' | '));
      }
    }
    if (toc.next) {
      renderer.tag('a', {href: toc.next.url, class: 'next'}, t('next &gt;'));
    }
    renderer.endTag();
  }
  if (showBreadcrumbs) {
    renderer.startTag('ul', {class: 'breadcrumbs'});
    toc.breadcrumbs.forEach(function(crumb) {
      renderer
        .startTag('li')
        .tag('a', {href: crumb.url}, crumb.title)
        .endTag();
    });
    renderer.endTag();
  }
  if (showTopLevelTOC) {
    renderer
      .startTag('ul', {class: 'toc'});
    toc.topLevelTOC.forEach(function(entry) {
      renderer
        .startTag('li')
        .tag('a', {href: entry.url}, entry.title)
        .endTag();
    });
    renderer
      .endTag();

    // TODO: render this under the current module/section
    if (toc.localTOC) {
      renderer
        .startTag('ul', {class: 'local-toc'});
      toc.localTOC.forEach(function(entry) {
        renderer
          .startTag('li')
          .tag('a', {href: entry.url}, entry.title)
          .endTag();
      });
      renderer
        .endTag();
    }
  }
  renderer
    .endTag()
    .finally(done);
};