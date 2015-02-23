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
    // Look for the cached JSON file
    var sepExp = new RegExp(path.sep.replace(/\\/g, '\\\\'), 'g');
    var cacheFile = path.join(cacheDirectory, relativeFilePath.replace(sepExp, '_')) + 'on';
    if (fs.existsSync(cacheFile)) {
      // Check that cache file is more recent than the code file.
      var cacheFileDate = fs.statSync(cacheFile).mtime;
      var sourceDate = fs.statSync(filePath).mtime;
      if (cacheFileDate > sourceDate) {
        context.item = require(cacheFile);
        nextStore();
        return;
      }
    }

    // More required libraries
    var jsdoc2md = require('jsdoc-to-markdown');
    var stream = require('stream');
    var Readable = stream.Readable;
    var PassThrough = stream.PassThrough;

    // build relative URL for this topic.
    var relativeUrl = path.resolve(filePath).substr(root.length).replace(/\\/g, '/');
    // Generate a title from the file name.
    var fileNameToString = context.scope.require('filename-to-string').transform;
    var title = fileNameToString(filePath);

    // Find the closest manifest that has a repository URL
    var currentPath = path.dirname(filePath);
    var source = null;
    var tokens = context.scope.require('tokens');
    if (tokens) {
      while (currentPath.substr(0, root.length) === root) {
        var repoPath = path.join(currentPath, 'package.json');
        if (fs.existsSync(repoPath)) {
          var repo = require(repoPath);
          if (repo && repo.repository && repo.repository.url) {
            var repoUrl = repo.repository.url;
            var format = repo.repository.pathFormat
              || '{{repo-no-ext}}/blob/master{{path}}';
            source = tokens.interpolate(format, {
              repo: repoUrl,
              'repo-no-ext': repoUrl.substr(0,
                repoUrl.length - path.extname(repoUrl).length),
              path: relativeUrl
            });
            break;
          }
        }
        currentPath = path.dirname(currentPath);
      }
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
        path: relativeUrl,
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