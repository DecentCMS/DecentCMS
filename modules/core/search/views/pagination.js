// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var querystring = require('querystring');

module.exports = function paginationTemplate(paginationPart, renderer, done) {
  var query = paginationPart.query;
  var path = paginationPart.path;
  var pageParameter = paginationPart.pageParameter;
  var lastPage = paginationPart.pageCount - 1;

  function getPageUrl(page) {
    if (page) {
      query[pageParameter] = page + 1;
    }
    else {
      delete query[pageParameter];
    }
    var qs = querystring.stringify(query);
    return qs.length === 0 ? path : path + '?' + qs;
  }

  renderer
    .startTag('nav')
    .startTag('ul', {
      'class': 'pagination pagination-' + paginationPart.meta.name
    });
  if (paginationPart.displayFirstLast) {
    renderer
      .startTag('li', paginationPart.page === 0 ? {'class': 'disabled'} : {})
      .tag('a', {href: getPageUrl(0)}, '&laquo;')
      .endTag();
  }
  if (paginationPart.displayNextPrevious) {
    renderer
      .startTag('li', paginationPart.page === 0 ? {'class': 'disabled'} : {})
      .tag('a', {href: getPageUrl(paginationPart.page - 1)}, '&lt;')
      .endTag();
  }
  if (paginationPart.displayPages) {
    for (var page = 0; page < paginationPart.pageCount; page++) {
      if (page === paginationPart.page) {
        renderer
          .startTag('li', {'class': 'active'})
          .tag('a', {href: '#'}, (page + 1).toString())
          .endTag();
      }
      else {
        renderer
          .startTag('li')
          .tag('a', {href: getPageUrl(page)}, (page + 1).toString())
          .endTag();
      }
    }
  }
  if (paginationPart.displayNextPrevious) {
    renderer
      .startTag('li', paginationPart.page === lastPage ? {'class': 'disabled'} : {})
      .tag('a', {href: getPageUrl(paginationPart.page + 1)}, '&gt;')
      .endTag();
  }
  if (paginationPart.displayFirstLast) {
    renderer
      .startTag('li', paginationPart.page === lastPage ? {'class': 'disabled'} : {})
      .tag('a', {href: getPageUrl(lastPage)}, '&raquo;')
      .endTag();
  }
  renderer
    .endTag()
    .endTag()
    .finally(done);
};