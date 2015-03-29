// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Uses `package.json` manifest files to find the URL of the repository
 * containing a file.
 * @constructor
 */
function ManifestRepositoryUrlResolver(scope) {
  this.scope = scope;
}
ManifestRepositoryUrlResolver.feature = 'manifest-repository-resolution';
ManifestRepositoryUrlResolver.service = 'repository-resolution';
ManifestRepositoryUrlResolver.scope = 'shell';

/**
 * Resolves the repository URL for a file.
 * @param {string} filePath
 * The path of the file for which the repository must be found.
 * @param {string} displayType
 * The type of view for which we want the URL, 'display' or 'edit'.
 * @returns {string} the URL of the repository, or null if not found.
 */
ManifestRepositoryUrlResolver.prototype.resolve = function resolve(filePath, displayType) {
  var tokens = this.scope.require('tokens');
  if (tokens) {
    var path = require('path');
    var fs = require('fs');
    var currentPath = filePath;
    var root = path.resolve('');
    // build relative URL for this path.
    var relativeUrl = path.resolve(filePath).substr(root.length).replace(/\\/g, '/');
    while (currentPath.substr(0, root.length) === root) {
      var manifestPath = path.join(currentPath, 'package.json');
      if (fs.existsSync(manifestPath)) {
        var manifest = require(manifestPath);
        if (manifest && manifest.repository && manifest.repository.url) {
          var repoUrl = manifest.repository.url;
          var format = manifest.repository.pathFormat
            || '{{repo-no-ext}}/{{display-type|equals>edit|choose>edit>blob}}/master{{path}}';
          return tokens.interpolate(format, {
            repo: repoUrl,
            'display-type': displayType,
            'repo-no-ext': repoUrl.substr(0,
              repoUrl.length - path.extname(repoUrl).length),
            path: relativeUrl
          });
        }
      }
      currentPath = path.dirname(currentPath);
    }
  }
  return null;
};

module.exports = ManifestRepositoryUrlResolver;