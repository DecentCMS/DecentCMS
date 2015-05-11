// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function searchResultsTemplate(searchResultsPart, renderer, done) {
  var result = searchResultsPart.result;
  if (Array.isArray(result)) {
    renderer.startTag('ul', {
      'class': 'search-results search-results-' + searchResultsPart.meta.name
    });
    searchResultsPart.result.forEach(function renderResultEntry(entry) {
      renderer.startTag('li');
      if (entry.url) {
        renderer.tag('a', {href: entry.url}, entry.title);
      }
      else {
        renderer.write(entry.title);
      }
      renderer.endTag();
    });
    renderer
      .endTag()
      .finally(done);
  }
  else {
    renderer.write(result).finally(done);
  }
};