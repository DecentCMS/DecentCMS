// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');
var fs = require('fs');
var async = require('async');
var YAML = require('yamljs');
var Snippable = require('snippable');
var snippable = new Snippable();

/**
 * @description
 * Parses a multipart YAML/Markdown document.
 * The YAML part becomes the item, and the Markdown
 * becomes the body part with a Markdown flavor.
 * @param {string} data The data to parse.
 * @returns {object} The parsed content item.
 */
function parseYamlMarkdown(data) {
  var parts = snippable.parse(data, ['yaml', 'md']);
  var item = parts[0];
  var md = parts[1];
  item.body = {
    flavor: 'markdown',
    _data: md
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
  parse: function parseJsonYamlMarkdown(context, nextParser) {
    var path = context.path;
    var ext = path.substr(-5);
    var data = context.data;
    var item = ext === '.json'
      ? JSON.parse(data)
      : ext === '.yaml'
      ? YAML.parse(data)
      : path.substr(-8) === '.yaml.md'
      ? parseYamlMarkdown(data)
      : null;
    if (item) {
      context.item = item;
    }
    nextParser();
  }
};

module.exports = jsonYamlMarkdownFileParser;