// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: find a way for sync methods to call other sync methods without going through async.

var stream = require('stream');
var Transform = stream.Transform;
var flasync = require('flasync');
var util = require('util');
var html = require('htmlencode');

util.inherits(RenderStream, Transform);

/**
 * @description
 * A transform stream for rendering shapes.
 * @param scope
 * @constructor
 */
function RenderStream(scope, options) {
  var self = this;
  Transform.call(this, {
    objectMode: true
  });
  flasync(this);
  options = options || {};
  this.scope = scope;
  this.scripts = options.scripts = options.scripts || [];
  this.stylesheets = options.stylesheets = options.stylesheets || [];
  this.meta = options.meta = options.meta || {};
  this.title = options.title = options.title || '';
  this.tags = options.tag = options.tags || [];

  this._transform = function transform(chunk, encoding, next) {
    this.push(chunk);
    next();
  };

  /**
   * @description
   * Writes a string, unencoded.
   * @param {string} text The text to write.
   */
  this.write = this.asyncify(this._write =
    function write(text) {

    this.push(text);
    return this;
  });

  /**
   * @description
   * Writes the string after HTML-encoding it.
   * @param {string} text The string to write.
   */
  this.writeEncoded = this.asyncify(this._writeEncoded =
    function writeEncoded(text) {

    this.push(html.htmlEncode(text));
    return this;
  });

  /**
   * @description
   * Writes the string, followed by \r\n.
   * @param {string} [text] The string to write.
   */
  this.writeLine = this.asyncify(this._writeLine =
    function writeLine(text) {

    if (text) {this.push(text);}
    this.push('\r\n');
    return this;
  });

  /**
   * @description
   * Writes the string after HTML-encoding it, followed by \r\n.
   * @param {string} [text] The string to write.
   */
  this.writeEncodedLine = this.asyncify(this._writeEncodedLine =
    function writeEncodedLine(text) {

    if (text) {this.push(html.htmlEncode(text));}
    this.push('\r\n');
    return this;
  });

  /**
   * @description
   * Renders a <br/> tag.
   */
  this.br = this.asyncify(this._br =
    function br() {

    this.push('<br/>\r\n');
    return this;
  });

  /**
   * @description
   * Renders a tag.
   * @param {string} tagName      The name of the tag.
   * @param {object} [attributes] Attributes to add to the tag.
   * @param {string} [content]    Text content of the tag.
   */
  this.tag = this.asyncify(this._tag =
    function tag(tagName, attributes, content) {

    if (typeof content === 'string') {
      this._startTag(tagName, attributes);
      this._writeEncoded(content);
      this._endTag();
    }
    else {
      this.push('<' + tagName);
      this._renderAttributes(attributes);
      this.push('/>');
    }
    return this;
  });

  /**
   * @description
   * Renders attributes as name="encoded value".
   * @param {object} attributes The attributes to render.
   */
  this.renderAttributes = this.asyncify(this._renderAttributes =
    function renderAttributes(attributes) {

    for (var attributeName in attributes) {
      this.push(' ' + attributeName + '="' +
        html.htmlEncode(attributes[attributeName]) +
      '"');
    }
    return this;
  });

  /**
   * @description
   * Writes the a start tag, and pushes the tag on a stack in order
   * for endTag to know what tag to close.
   * @param {string} tagName      The name of the tag.
   * @param {object} [attributes] The attributes of the tag.
   */
  this.startTag = this.asyncify(this._startTag =
    function startTag(tagName, attributes) {

    this.push('<' + tagName);
    this._renderAttributes(attributes);
    this.push('>');
    this.tags.push(tagName);
    return this;
  });

  /**
   * @description
   * Writes the end tag for the latest unclosed tag started.
   */
  this.endTag = this.asyncify(this._endTag =
    function endTag() {

    var tagName = this.tags.pop();
    this.push('</' + tagName + '>');
    return this;
  });

  /**
   * @description
   * Closes all pending tags.
   */
  this.endAllTags = this.asyncify(this._endAllTags =
    function endAllTags() {

    while (this.tags.length) {
      this._endTag();
    }
    return this;
  });

  /**
   * @description
   * Triggers the rendering of the provided shape.
   * @param {object} [shape]      The shape to render.
   * @param {string} [tag]        An optional tag name to enclose the shape in if it exists.
   * @param {object} [attributes] An optional list of attributes to add to the enclosing tag.
   */
  this.shape = this.async(this._shape =
    function renderShape(shape, tag, attributes, done) {
      if (typeof(shape) === 'function') {
        done = shape;
        shape = null;
      }
      if (typeof(tag) === 'function') {
        done = tag;
        tag = null;
      } else {
        if (typeof(attributes) === 'function') {
          if (shape) this._startTag(tag);
          done = attributes;
          attributes = null;
        }
        else {
          if (shape) this._startTag(tag, attributes);
        }
      }
      if (!shape) {
        done();
        return this;
      }
      var innerRenderStream = new RenderStream(scope, options);
      innerRenderStream.on('data', function(data) {
        self.push(data);
      });
      this.scope.callService('rendering-strategy', 'render', {
        shape: shape,
        renderStream: innerRenderStream
      }, function() {
        if (tag) {
          self.endTag();
        }
        done();
      });
      return this;
    }
  );

  /**
   * @description
   * Renders a doctype tag.
   * @param {string} [type] The doctype. 'html' if not specified.
   */
  this.doctype = this.asyncify(this._doctype =
    function doctype(type) {

    this.push('<!DOCTYPE ' + (type || 'html') + '>');
    return this;
  });

// TODO: handle minimized files

  /**
   * @description
   * Adds a style sheet to the list of style sheets.
   * The style sheet name will resolve to a file in the theme, or in
   * modules, under a css folder.
   * @param {string} name The name of a local style sheet file.
   */
  this.addStyleSheet = this.asyncify(this._addStyleSheet =
    function addStyleSheet(name) {

    var url = '/css/' + name + '.css';
    this._addExternalStyleSheet(url);
    return this;
  });

  /**
   * @description
   * Adds an external style sheet to the list of style sheets.
   * @param {string} url The URL of an external style sheet file.
   */
  this.addExternalStyleSheet = this.asyncify(this._addExternalStyleSheet =
    function addExternalStyleSheet(url) {

    if (this.stylesheets.indexOf(url) === -1) {
      this.stylesheets.push(url);
    }
    return this;
  });

  /**
   * @description
   * Renders all style sheets that have been registered so far using
   * addStyleSheet and addExternalStyleSheet.
   */
  this.renderStyleSheets = this.asyncify(this._renderStyleSheets =
    function renderStyleSheets() {

    for (var i = 0; i < this.stylesheets.length; i++) {
      this.push('  ');
      this._tag('link', {
        href: this.stylesheets[i],
        rel: 'stylesheet',
        type: 'text/css'
      });
      this.push('\r\n');
    }
    return this;
  });

  /**
   * @description
   * Adds a script to the list of scripts.
   * The script name will resolve to a file in the theme, or in
   * modules, under a js folder.
   * @param {string} name The name of a local script file.
   */
  this.addScript = this.asyncify(this._addScript =
    function addScript(name) {

    var url = '/js/' + name + '.js';
    this._addExternalScript(url);
    return this;
  });

  /**
   * @description
   * Adds an external script to the list of scripts.
   * @param {string} url The URL of an external script file.
   */
  this.addExternalScript = this.asyncify(this._addExternalScript =
    function addExternalScript(url) {

    if (this.scripts.indexOf(url) === -1) {
      this.scripts.push(url);
    }
    return this;
  });

  /**
   * @description
   * Renders all scripts that have been registered so far using
   * addScript and addExternalScript.
   */
  this.renderScripts = this.asyncify(this._renderScripts =
    function renderScripts() {

    for (var i = 0; i < this.scripts.length; i++) {
      this.push('  ');
      this._tag('script', {
        src: this.scripts[i],
        type: 'text/javascript'
      }, '');
      this.push('\r\n');
    }
    return this;
  });

  /**
   * @description
   * Adds a meta tag. This does not render the tag, it just stores the data for,
   * typically, the layout template to render using renderMeta.
   * @param {string} name         The name of the meta tag (will be rendered as the name attribute).
   * @param {string} value        The value of the meta tag (will be rendered as the content attribute).
   * @param {object} [attributes] Additional attributes to add to the meta tag.
   */
  this.addMeta = this.asyncify(this._addMeta =
    function addMeta(name, value, attributes) {

    this.meta[name] = {
      name: name,
      value: value,
      attributes: attributes
    };
    return this;
  });

  /**
   * @description
   * Renders the meta tag that have been registered so far using addMeta.
   */
  this.renderMeta = this.asyncify(this._renderMeta =
    function renderMeta() {

    for (var name in this.meta) {
      var meta = this.meta[name];
      var attributes = meta.attributes || {};
      attributes.name = meta.name;
      attributes.content = meta.value;
      this.push('  ');
      this.tag('meta', attributes);
      this.push('\r\n');
    }
    return this;
  });
};

RenderStream.feature = 'render-stream';
RenderStream.scope = 'request';

module.exports = RenderStream;