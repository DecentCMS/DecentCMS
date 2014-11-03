// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * Markdown text field flavor
 * @param scope
 * @param options
 * @param {boolean} [options.gfm] Enable GitHub-flavored Markdown.
 * @param {boolean} [options.tables] Enable GFM tables.
 * @param {boolean} [options.breaks] Enable GFM line breaks.
 * @param {boolean} [options.pedantic] Conform to markdown.pl, bugs included.
 * @param {boolean} [options.sanitize] Sanitize the output.
 * @param {boolean} [options.smartLists] Smarter list behavior.
 * @param {boolean} [options.smartyPants] Use smart typographic punctuation.
 * @constructor
 */
function MarkdownFlavor(scope, options) {
  this.scope = scope;
  this.marked = require('marked');
  this.marked.setOptions(options);
}
MarkdownFlavor.service = 'text-flavor';
MarkdownFlavor.feature = 'markdown';

/**
 * Matches if the flavor is 'md' or 'markdown'.
 * @param {string} flavor The flavor to match.
 * @returns {boolean} true if the flavor is md or markdown.
 */
MarkdownFlavor.prototype.matches = function(flavor) {
  return flavor === 'markdown' || flavor === 'md';
};

/**
 * @description
 * Transforms the markdown code into HTML.
 * @param {string} markdown The Markdown code.
 * @returns {string} The HTML.
 */
MarkdownFlavor.prototype.getHtml = function(markdown) {
  return this.marked(markdown);
};

module.exports = MarkdownFlavor;