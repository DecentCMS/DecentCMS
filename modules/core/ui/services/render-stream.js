// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: morph this so this enables sequential rendering while maintaining asynchronicity.

var stream = require('stream');
var Transform = stream.Transform;
var util = require('util');
var html = require('htmlencode');

util.inherits(RenderStream, Transform);

/**
 * @description
 * A transform stream for rendering shapes.
 * @param scope
 * @param [options.contentManager]
 * @constructor
 */
function RenderStream(scope, options) {
  Transform.call(this, {
    objectMode: true
  });
  options = options || {};
  this.scope = scope;
  this.scripts = [];
  this.stylesheets = [];
  this.meta = {};
  this.title = options.title || '';
  this.tags = [];
  this.contentManager = options.contentManager;
};
RenderStream.feature = 'render-stream';

RenderStream.prototype._transform = function transform(chunk, encoding, next) {
  this.push(chunk);
  next();
};

/**
 * @description
 * Writes the string after HTML-encoding it.
 * @param {string} text The string to write.
 */
RenderStream.prototype.writeEncoded = function writeEncoded(text) {
  this.write(html.htmlEncode(text));
};

/**
 * @description
 * Writes the string, followed by \r\n.
 * @param {string} [text] The string to write.
 */
RenderStream.prototype.writeLine = function writeLine(text) {
  if (text) {this.write(text);}
  this.write('\r\n');
}

/**
 * @description
 * Writes the string after HTML-encoding it, followed by \r\n.
 * @param {string} [text] The string to write.
 */
RenderStream.prototype.writeEncodedLine = function writeEncodedLine(text) {
  if (text) {this.writeEncoded(text);}
  this.write('\r\n');
};

/**
 * @description
 * Renders a tag.
 * @param {string} tagName      The name of the tag.
 * @param {object} [attributes] Attributes to add to the tag.
 * @param {string} [content]    Text content of the tag.
 */
RenderStream.prototype.tag = function tag(tagName, attributes, content) {
  if (content) {
    this.startTag(tagName, attributes);
    this.writeEncoded(content);
    this.endTag();
  }
  else {
    this.write('<' + tagName);
    this.renderAttributes(attributes);
    this.write('/>');
  }
};

/**
 * @description
 * Renders attributes as name="encoded value".
 * @param {object} attributes The attributes to render.
 */
RenderStream.prototype.renderAttributes = function renderAttributes(attributes) {
  for (var attributeName in attributes) {
    this.write(' ' + attributeName + '="');
    this.writeEncoded(attributes[attributeName]);
    this.write('"');
  }
};

/**
 * @description
 * Writes the a start tag, and pushes the tag on a stack in order
 * for endTag to know what tag to close.
 * @param {string} tagName      The name of the tag.
 * @param {object} [attributes] The attributes of the tag.
 */
RenderStream.prototype.startTag = function startTag(tagName, attributes) {
  this.write('<' + tagName);
  this.renderAttributes(attributes);
  this.write('>');
  this.tags.push(tagName);
};

/**
 * @description
 * Writes the end tag for the latest unclosed tag started.
 */
RenderStream.prototype.endTag = function endTag() {
  var tagName = this.tags.pop();
  this.write('</' + tagName + '>');
};

// TODO: handle minimized files

/**
 * @description
 * Adds a style sheet to the list of style sheets.
 * The style sheet name will resolve to a file in the theme, or in
 * modules, under a css folder.
 * @param {string} name The name of a local style sheet file.
 */
RenderStream.prototype.addStyleSheet = function addStyleSheet(name) {
  var fileResolver = this.scope.require('file-resolution');
  var fileName = name + '.css';
  var filePath = fileResolver.resolve('css', fileName);
  var url = '/css/' + fileName;
  this.addExternalStyleSheet(url);
};

/**
 * @description
 * Adds an external style sheet to the list of style sheets.
 * @param {string} url The URL of an external style sheet file.
 */
RenderStream.prototype.addExternalStyleSheet = function addExternalStyleSheet(url) {
  if (!(url in this.stylesheets)) {
    this.stylesheets.push(url);
  }
};

/**
 * @description
 * Renders all style sheets that have been registered so far using
 * addStyleSheet and addExternalStyleSheet.
 */
RenderStream.prototype.renderStyleSheets = function renderStyleSheets() {
  for (var i = 0; i < this.stylesheets.length; i++) {
    this.write('  ');
    this.tag('link', {
      href: this.stylesheets[i],
      rel: 'stylesheet',
      type: 'text/css'
    });
    this.writeLine();
  }
};

/**
 * @description
 * Adds a meta tag. This does not render the tag, it just stores the data for,
 * typically, the layout template to render using renderMeta.
 * @param {string} name         The name of the meta tag (will be rendered as the name attribute).
 * @param {string} value        The value of the meta tag (will be rendered as the content attribute).
 * @param {object} [attributes] Additional attributes to add to the meta tag.
 */
RenderStream.prototype.addMeta = function addMeta(name, value, attributes) {
  this.meta[name] = {
    name: name,
    value: value,
    attributes: attributes
  };
};

/**
 * @description
 * Renders the meta tag that have been registered so far using addMeta.
 */
RenderStream.prototype.renderMeta = function renderMeta() {
  for (var name in this.meta) {
    var meta = this.meta[name];
    var attributes = meta.attributes || {};
    attributes.name = meta.name;
    attributes.content = meta.value;
    this.write('  ');
    this.tag('meta', attributes);
    this.writeLine();
  }
};

// TODO: add API to render a shape, that internally triggers the rendering event

module.exports = RenderStream;