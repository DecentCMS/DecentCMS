// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var path = require('path');

/**
 * Maps documentation topic ids onto the relevant file, in the right module.
 * @constructor
 */
var DocumentationPathMapper = function DocumentationPathMapper(scope) {
  this.scope = scope;
};
DocumentationPathMapper.service = 'id-to-path-map';
DocumentationPathMapper.feature = 'documentation';
DocumentationPathMapper.scope = 'shell';

/**
 * Maps documentation topic ids onto the relevant file, in the right module.
 * @param {string} root The content root for documentation
 * (anything other than 'doc' will be ignored).
 * @param {string} id The topic's id. If top-level, that is the name of the documentation
 * file, without extension. If it's a module documentation topic, it's
 * [module-technical-name]/[topic-filename-without-extension].
 * @returns {string[]} The list of possible paths for a file describing the topic.
 */
DocumentationPathMapper.prototype.mapIdToPath = function mapDocumentationIdToPath(root, id) {
  if (root !== 'docs') return null;
  var idParts = id.split('/');
  var moduleName = idParts[0];
  var shell = this.scope.require('shell');
  var module = shell.moduleManifests[moduleName];
  var rootPath = module ? path.resolve(module.physicalPath, 'docs') : path.resolve('docs');
  var topic = (module ? idParts[1] : moduleName) || 'index';
  var topicPath = path.join(rootPath, topic);
  return [
    topicPath + '.json',
    topicPath + '.yaml',
    topicPath + '.yaml.md'
  ];
};

module.exports = DocumentationPathMapper;