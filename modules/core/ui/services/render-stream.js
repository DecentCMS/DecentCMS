// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var util = require('util');

// TODO: add automatic indentation
// TODO: handle .min when not in debug, for stylesheets and scripts

/**
 * @description
 * A transform stream for rendering shapes.
 * @constructor
 * @param {object} scope The scope
 * @param {object} options The options
 * @param {Array} [options.scripts] The list of scripts
 * @param {Array} [options.stylesheets] The list of stylesheets
 * @param {object} [options.meta] The meta tags
 * @param {string} [options.title] The title
 * @param {Array} [options.tags] The stack of tags currently open
 */
function RenderStream(scope, options) {
  var flasync = require('flasync');
  var html = require('htmlencode');

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
  this.metaIndex = 0;
  this.title = options.title = options.title || '';
  this.tags = options.tag = options.tags || [];

  this._transform = function transform(chunk, encoding, next) {
    this.push(chunk);
    next();
  };

  this._onError = function onError(err) {
    throw err;
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
    }
  );

  /**
   * @description
   * Writes the string after HTML-encoding it.
   * @param {string} text The string to write.
   */
  this.writeEncoded = this.asyncify(this._writeEncoded =
    function writeEncoded(text) {
      this.push(html.htmlEncode(text));
      return this;
    }
  );

  /**
   * @description
   * Writes the string, followed by \r\n.
   * @param {string} [text] The string to write.
   */
  this.writeLine = this.asyncify(this._writeLine = (
    scope.debug
      ? function writeLine(text) {
        if (text) {
          this.push(text);
        }
        this.push('\r\n');
        return this;
      }
      : function writeLine(text) {
        if (text) {
          this.push(text);
        }
        return this;
      })
  );

  /**
   * @description
   * Writes the string after HTML-encoding it, followed by \r\n.
   * @param {string} [text] The string to write.
   */
  this.writeEncodedLine = this.asyncify(this._writeEncodedLine =
    scope.debug
      ? function writeLine(text) {
        if (text) {
          this.push(html.htmlEncode(text));
        }
        this.push('\r\n');
        return this;
      }
      : function writeLine(text) {
      if (text) {
        this.push(html.htmlEncode(text));
      }
      return this;
    }
  );

  /**
   * @description
   * Renders a &lt;br/&gt; tag.
   */
  this.br = this.asyncify(this._br =
    scope.debug
      ? function br() {
        this.push('<br/>\r\n');
        return this;
      }
      : function br() {
        this.push('<br/>');
        return this;
      }
  );

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
    }
  );

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
    }
  );

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
    }
  );

  /**
   * @description
   * Writes the end tag for the latest unclosed tag started.
   */
  this.endTag = this.asyncify(this._endTag =
    function endTag() {
      var tagName = this.tags.pop();
      this.push('</' + tagName + '>');
      return this;
    }
  );

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
    }
  );

  /**
   * @description
   * Triggers the rendering of the provided shape.
   * @param {object} [options] The options object.
   * @param {object} [options.shape] The shape to render.
   * @param {string} [options.tag] An optional tag name to enclose the shape in if it exists.
   * @param {object} [options.attributes] An optional list of attributes to add to the enclosing tag.
   * @param {string} [options.shapeName] An optional name for the shape that overrides `shape.meta.type`.
   */
  this.shape = this.async(this._shape =
    function renderShape(options, done) {
      if (typeof(options) === 'function') {
        done = options;
        options = {};
      }
      var shape = options.shape || null;
      var tag = options.tag || null;
      var attributes = options.attributes || null;
      var shapeName = options.shapeName || null;
      if (shape && tag) this._startTag(tag, attributes);
      if (!shape) {
        done();
        return this;
      }
      var innerRenderStream = new RenderStream(scope, options);
      innerRenderStream.title = self.title;
      innerRenderStream
        .on('data', function(data) {
          self.push(data);
        })
        .onError(function(err) {
          done(err);
          return;
        });
      this.scope.callService('rendering-strategy', 'render', {
        shape: shape,
        shapeName: shapeName,
        renderStream: innerRenderStream
      }, function(err) {
        if (err) {
          done(err);
          return;
        }
        if (tag) {
          self._endTag();
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
    }
  );

// TODO: handle minimized files

  /**
   * @description
   * Adds a style sheet to the list of style sheets.
   * The style sheet name will resolve to a file in the theme, or in
   * modules, under a css folder.
   * @param {string} name The name of a local style sheet file.
   */
  this.addStyleSheet = this.asyncify(this._addStyleSheet =
    scope.debug
      ? function addStyleSheet(name) {
        var url = '/css/' + name + '.css';
        this._addExternalStyleSheet(url);
        return this;
      }
      : function addStyleSheet(name) {
        var url = '/css/' + name + '.min.css';
        this._addExternalStyleSheet(url);
        return this;
      }
  );

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
    }
  );

  /**
   * @description
   * Renders all style sheets that have been registered so far using
   * addStyleSheet and addExternalStyleSheet.
   */
  this.renderStyleSheets = this.asyncify(this._renderStyleSheets =
    scope.debug
      ? function renderStyleSheets() {
        for (var i = 0; i < this.stylesheets.length; i++) {
          this._tag('link', {
            href: this.stylesheets[i],
            rel: 'stylesheet',
            type: 'text/css'
          });
          this.push('\r\n');
        }
        return this;
      }
      : function renderStyleSheets() {
        for (var i = 0; i < this.stylesheets.length; i++) {
          this._tag('link', {
            href: this.stylesheets[i],
            rel: 'stylesheet',
            type: 'text/css'
          });
        }
        return this;
      }
  );

  /**
   * @description
   * Adds a script to the list of scripts.
   * The script name will resolve to a file in the theme, or in
   * modules, under a js folder.
   * @param {string} name The name of a local script file.
   */
  this.addScript = this.asyncify(this._addScript =
    scope.debug
      ? function addScript(name) {
        var url = '/js/' + name + '.js';
        this._addExternalScript(url);
        return this;
      }
      : function addScript(name) {
        var url = '/js/' + name + '.min.js';
        this._addExternalScript(url);
        return this;
      }
  );

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
    }
  );

  /**
   * @description
   * Renders all scripts that have been registered so far using
   * addScript and addExternalScript.
   */
  this.renderScripts = this.asyncify(this._renderScripts =
    scope.debug
      ? function renderScripts() {
        for (var i = 0; i < this.scripts.length; i++) {
          this._tag('script', {
            src: this.scripts[i],
            type: 'text/javascript'
          }, '');
          this.push('\r\n');
        }
        return this;
      }
      : function renderScripts() {
        for (var i = 0; i < this.scripts.length; i++) {
          this._tag('script', {
            src: this.scripts[i],
            type: 'text/javascript'
          }, '');
        }
        return this;
      }
  );

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
      if (name) {
        this.meta[name] = {
          name: name,
          value: value,
          attributes: attributes
        };
      }
      else {
        this.meta['m' + this.metaIndex++] = {
          value: value,
          attributes: attributes
        };
      }
      return this;
    }
  );

  /**
   * @description
   * Renders the meta tag that have been registered so far using addMeta.
   */
  this.renderMeta = this.asyncify(this._renderMeta =
    scope.debug
      ? function renderMeta() {
        for (var name in this.meta) {
          var meta = this.meta[name];
          var attributes = meta.attributes || {};
          if (meta.name) attributes.name = meta.name;
          if (meta.value) attributes.content = meta.value;
          this.tag('meta', attributes);
          this.push('\r\n');
        }
        return this;
      }
      : function renderMeta() {
        for (var name in this.meta) {
          var meta = this.meta[name];
          var attributes = meta.attributes || {};
          if (meta.name) attributes.name = meta.name;
          if (meta.value) attributes.content = meta.value;
          this.tag('meta', attributes);
        }
        return this;
      }
  );
}

var stream = require('stream');
var Transform = stream.Transform;
util.inherits(RenderStream, Transform);

RenderStream.feature = 'render-stream';
RenderStream.scope = 'request';

module.exports = RenderStream;