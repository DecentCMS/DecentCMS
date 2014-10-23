// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

function MarkdownFlavor(shell, options) {
  this.shell = shell;
  this.marked = require('marked');
  this.marked.setOptions(options);
}

MarkdownFlavor.prototype.matches = function(flavor) {
  return flavor === 'markdown' || flavor === 'md';
};

MarkdownFlavor.prototype.getHtml = function(markdown) {
  return this.marked(markdown);
};

module.exports = MarkdownFlavor;