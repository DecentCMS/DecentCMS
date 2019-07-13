// DecentCMS (c) 2019 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Extracts a summary from HTML
 */
const defaultSummarizeStrategy = {
  service: 'summarize-strategy',
  feature: 'default-summarize-strategy',
  scope: 'shell',
  /**
   * Extracts the first paragraph, or all HTML until a `<!--more-->` is found.
   * @param {string} html The HTML to summarize
   * @returns {string} The summary HTML.
   */
  summarize: function summarize(html) {
    html = html || '';
    let output = html;
    const more = html.search(/<!--more.*-->/gm);
    if (more !== -1) {
      output = html.substr(0, more);
    }
    else {
      const p = html.match(/<p[^>]*>([\w\W]+?)<\/p>/gmi) || [];
      if (p[0]) output = p[0];
    }
    return output;
  }
};

module.exports = defaultSummarizeStrategy;