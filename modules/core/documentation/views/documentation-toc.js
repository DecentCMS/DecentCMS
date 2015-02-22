// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function documentationTocTemplate(toc, renderer, done) {
  var showTopLevelTOC = !!toc.showTopLevelTOC;
  var showBreadcrumbs = !!toc.showBreadcrumbs;
  var showNextPrevious = !! toc.showNextPrevious;
  var t = renderer.scope.require('localization');
  renderer.startTag('nav', {class: 'docs-sidenav'});
  if (showBreadcrumbs) {
    renderer.startTag('ol', {class: 'breadcrumb'});
    toc.breadcrumbs.forEach(function(crumb, index) {
      var isLast = index === toc.breadcrumbs.length - 1;
      var cls = isLast ? 'active' : null;
      var attr = cls ? {class: cls} : null;
      renderer.startTag('li', attr);
      if (isLast) {
        renderer.write(crumb.title);
      }
      else {
        renderer.tag('a', {href: crumb.url}, crumb.title);
      }
      renderer.endTag();
    });
    renderer.endTag();
  }
  if (showNextPrevious) {
    renderer.startTag('ul', {class: 'pager'});
    if (toc.previous) {
      renderer
        .startTag('li', {class: 'previous'})
        .startTag('a', {href: toc.previous.url})
        .startTag('span', {class: 'glyphicon glyphicon-chevron-left', 'aria-hidden': 'true'})
        .endTag()
        .write('&nbsp;' + t('previous'))
        .endTag()
        .endTag();
    }
    if (toc.next) {
      renderer
        .startTag('li', {class: 'next'})
        .startTag('a', {href: toc.next.url})
        .write(t('next') + '&nbsp;')
        .startTag('span', {class: 'glyphicon glyphicon-chevron-right', 'aria-hidden': 'true'})
        .endTag()
        .endTag()
        .endTag();
    }
    renderer.endTag();
  }
  if (showTopLevelTOC) {
    var currentTopLevelItem = toc.breadcrumbs && toc.breadcrumbs[0]
        ? toc.breadcrumbs[0] : null;
    renderer
      .startTag('ul', {class: 'toc'});
    toc.topLevelTOC.forEach(function(entry) {
      var isActive = toc.localTOC
        && currentTopLevelItem
        && currentTopLevelItem.itemId === entry.itemId;
      renderer
        .startTag('li', isActive ? {class: 'active'} : null)
        .tag('a', {href: entry.url}, entry.title);
      if (isActive) {
        renderer
          .startTag('ul', {class: 'local-toc toc'});
        toc.localTOC.forEach(function(entry) {
          isActive = entry.itemId === (toc.current ? toc.current.itemId : null);
          renderer
            .startTag('li', isActive ? {class: 'active'} : null)
            .tag('a', {href: entry.url}, entry.title)
            .endTag();
        });
        renderer
          .endTag();
      }
      renderer.endTag();
    });
    renderer
      .endTag();
  }
  renderer
    .endTag()
    .finally(done);
};