// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * Parses a multipart YAML/Markdown document.
 * The YAML part becomes the item, and the Markdown
 * becomes the body part with a Markdown flavor.
 * @param {string} data The data to parse.
 * @returns {object} The parsed content item.
 */
function parseYamlMarkdown(data) {
  var Snippable = require('snippable');
  var snippable = new Snippable();
  var parts = snippable.parse(data, ['yaml', 'md']);
  var item = parts[0];
  var md = parts[1];
  item.body = {
    flavor: 'markdown',
    text: md
  };
  return item;
}

/**
 * @description
 * A content file parser that uses .json, .yaml, and .yaml.md files.
 */
var jsonYamlMarkdownFileParser = {
  service: 'content-file-parser',
  feature: 'file-content-store',
  scope: 'shell',
  extensions: ['.json', '.yaml', '.yaml.md'],
  parse: function parseJsonYamlMarkdown(context, nextParser) {
    var YAML = require('yamljs');
    var filePath = context.path;
    var ext = filePath.substr(-5);
    var data = context.data;
    var item = ext === '.json'
      ? JSON.parse(data)
      : ext === '.yaml'
      ? YAML.parse(data)
      : filePath.substr(-8) === '.yaml.md'
      ? parseYamlMarkdown(data)
      : null;
    if (item) {
      context.item = item;
    }
    nextParser();
  }
};

module.exports = jsonYamlMarkdownFileParser;