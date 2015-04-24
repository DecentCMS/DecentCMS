// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';


/**
 * @description
 * A content store that uses the JsDoc inside source files.
 */
var jsDocContentFileParser = {
  service: 'content-file-parser',
  feature: 'api-documentation',
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
    var filePath = context.path;
    if (filePath.substr(-3) !== '.js') {
      nextStore();
      return;
    }
    var path = require('path');
    var root = path.resolve('');
    var relativeFilePath = path.resolve(filePath).substr(root.length + 1);
    // Checked for a cached pre-parsed copy
    var cacheDirectory = path.resolve('modules', 'core', 'documentation', 'cache');
    var fs = require('fs');
    // Create the directory if it doesn't exist.
    if (!fs.existsSync(cacheDirectory)) {
      fs.mkdirSync(cacheDirectory);
    }
    var shouldUpdateTheCache = true;
    var shell = context.scope.require('shell');
    if (shell) {
      var config = shell.settings[jsDocContentFileParser.feature];
      if (config && (config.onlyFromCache === true || (config.onlyFromCache === 'release' && !context.scope.debug))) {
        shouldUpdateTheCache = false;
      }
    }
    // Look for the cached JSON file
    var sepExp = new RegExp(path.sep.replace(/\\/g, '\\\\'), 'g');
    var cacheFile = path.join(cacheDirectory, relativeFilePath.replace(sepExp, '_')) + 'on';
    if (fs.existsSync(cacheFile)) {
      // Check that cache file is more recent than the code file.
      var cacheFileDate = fs.statSync(cacheFile).mtime;
      var sourceDate = fs.statSync(filePath).mtime;
      if (cacheFileDate > sourceDate || !shouldUpdateTheCache) {
        context.item = require(cacheFile);
        nextStore();
        return;
      }
    }

    // Cache was not found. Check if config allows for regeneration of the documentation.
    if (!shouldUpdateTheCache) {
      nextStore();
      return;
    }

    // More required libraries
    var jsdoc2md = require('jsdoc-to-markdown');
    var stream = require('stream');
    var Readable = stream.Readable;
    var PassThrough = stream.PassThrough;

    // Generate a title from the file name.
    var fileNameToString = context.scope.require('filename-to-string').transform;
    var title = fileNameToString(filePath);

    // Find the closest manifest that has a repository URL
    var source = null;
    var repositoryResolver = context.scope.require('repository-resolution');
    if (repositoryResolver) {
      source = repositoryResolver.resolve(filePath, 'display');
    }

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
      var service = require(filePath);
      context.item = {
        meta: {
          type: "api-documentation"
        },
        title: title,
        scope: service.scope,
        service: service.service,
        feature: service.feature,
        path: path.resolve(filePath).substr(root.length).replace(/\\/g, '/'),
        source: source,
        body: {
          flavor: 'markdown',
          text: md.join()
        }
      };
      // Cache it
      fs.writeFile(cacheFile, JSON.stringify(context.item, 0), nextStore);
    });
    // Then push that stream into the JsDoc parser
    stringStream.pipe(jsdoc2md.render()).pipe(resultStream);
  }
};

module.exports = jsDocContentFileParser;