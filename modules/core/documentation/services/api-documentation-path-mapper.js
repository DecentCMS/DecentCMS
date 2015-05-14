// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Maps API documentation topic ids onto the relevant file, in the right module.
 * @constructor
 */
var ApiDocumentationPathMapper = function ApiDocumentationPathMapper(scope) {
  this.scope = scope;
};
ApiDocumentationPathMapper.service = 'id-to-path-map';
ApiDocumentationPathMapper.feature = 'api-documentation';
ApiDocumentationPathMapper.scope = 'shell';

/**
 * Maps API documentation topic ids onto the relevant file, in the right module.
 * @param {string} root The content root for API documentation
 * (anything other than 'apidocs' will be ignored).
 * @param {string} id The topic's id, in the form:
 * [module-technical-name]/[source-filename-without-extension].
 * The file name does not include the path under the module.
 * @returns {string[]} The list of possible paths for a source file with
 * JsDoc comments to be extracted.
 */
ApiDocumentationPathMapper.prototype.mapIdToPath = function mapApiDocumentationIdToPath(root, id) {
  var path = require('path');
  if (root !== 'apidocs') return null;
  var idParts = id.split('/');
  var moduleName = idParts[0];
  var shell = this.scope.require('shell');
  var module = shell.moduleManifests[moduleName];
  if (!module) {
    return null;
  }
  var rootServicePath = path.resolve(module.physicalPath, 'services');
  var rootLibPath = path.resolve(module.physicalPath, 'lib');
  var topic = idParts[1];
  if (!topic) {
    return null;
  }
  var topicServicePath = path.join(rootServicePath, topic);
  var topicLibPath = path.join(rootLibPath, topic);
  return [
    topicServicePath + '.js',
    topicLibPath + '.js'
  ];
};

module.exports = ApiDocumentationPathMapper;