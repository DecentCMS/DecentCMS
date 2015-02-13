// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var jsdoc2md = require('jsdoc-to-markdown');
var stream = require('stream');
var Readable = stream.Readable;
var PassThrough = stream.PassThrough;

/**
 * @description
 * A content store that uses the JsDoc inside source files.
 */
var jsDocContentFileParser = {
  service: 'content-file-parser',
  feature: 'documentation',
  scope: 'shell',
  /**
   * @description
   * Parses a source file for JsDoc comments, and dynamically builds
   * a content item from it, with a Markdown body part, and the service
   * name as the title, de-dashed.
   * The scope, service name, and feature are added as properties
   * scope, service, and feature.
   * The content type is "api-documentation".
   * @param {object} context The context.
   * @param {object} context.scope The scope.
   * @param {string} context.path The path to the file to parse.
   * @param {string} context.data The text contents of the file to parse.
   * @param {object} [context.item] The parsed content item if it was found
   * and successfully parsed.
   * @param {function} nextStore The callback.
   */
  parse: function parseJsDoc(context, nextStore) {
    var path = context.path;
    if (path.substr(-3) !== '.js') {
      nextStore();
      return;
    }

    var fileNameToString = context.scope.require('filename-to-string').transform;
    var title = fileNameToString(path);

    // Make a readable stream out of the contents of the file.
    var stringStream = new Readable();
    stringStream.push(context.data);
    stringStream.push(null);

    // Prepare a stream to receive the markdown output.
    var resultStream = new PassThrough();
    var md = [];
    resultStream.on('data', function(data) {md.push(data);});
    resultStream.on('end', function() {
      // Build the content item.
      var service = require(path);
      // TODO: add link to source
      context.item = {
        meta: {
          type: "api-documentation"
        },
        title: title,
        scope: service.scope,
        service: service.service,
        feature: service.feature,
        body: {
          flavor: 'markdown',
          _data: md.join()
        }
      };
      nextStore();
    });
    // Then push that stream into the JsDoc parser
    stringStream.pipe(jsdoc2md.render()).pipe(resultStream);
  }
};

module.exports = jsDocContentFileParser;