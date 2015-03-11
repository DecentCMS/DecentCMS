// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

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
 * @param {string} root
 * The content root for documentation (anything other than 'doc' will be ignored).
 * @param {string} id
 * The topic's id. If top-level, that is the name of the documentation
 * file, without extension. If it's a module top-level documentation topic, it's
 * `[module-technical-name]/[topic-filename-without-extension]`.
 * If it's in a top-level section, it's
 * `[section-folder-name]/[topic-filename-without-extension]`.
 * If it's in a section under a module, it's
 * `[module-technical-name]/[section-folder-name]/[topic-filename-without-extension]`.
 * @returns {string[]} The list of possible paths for a file describing the topic.
 */
DocumentationPathMapper.prototype.mapIdToPath = function mapDocumentationIdToPath(root, id) {
  var path = require('path');
  if (root !== 'docs') return null;
  var idParts = id.split('/');
  // Attempt to resolve the module
  var moduleName = idParts[0];
  var shell = this.scope.require('shell');
  var module = shell.moduleManifests[moduleName];
  // Find the right docs folder
  var rootPath = module ? path.resolve(module.physicalPath, 'docs') : path.resolve('docs');
  // Is there a section?
  var section = module ? idParts[1] : idParts[0];
  if (section) {
    var fs = require('fs');
    var sectionPath = path.join(rootPath, section);
    if (!fs.existsSync(sectionPath) || !fs.statSync(sectionPath).isDirectory()) {
      section = null;
    }
  }
  // Get the topic
  var topic = (
    module
      ? (section ? idParts[2] : idParts[1])
      : (section ? idParts[1] : idParts[0])
    ) || 'index';
  var topicPath = section ? path.join(rootPath, section, topic) : path.join(rootPath, topic);
  return [
    topicPath + '.json',
    topicPath + '.yaml',
    topicPath + '.yaml.md'
  ];
};

module.exports = DocumentationPathMapper;