// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * A service that translates file names into human-readable strings.
 */
var fileNameToString = {
  service: 'filename-to-string',
  feature: 'file-content-store',
  scope: 'shell',
  /**
   * Transform a file name into a human-readable string.
   * @example 'filename-to-string.js' becomes 'Filename to string'.
   * @param {string} fileName The file name.
   * @returns {string} The human-readable string.
   */
  transform: function(fileName) {
    var path = require('path');
    var fileNameWithoutExtension = path.basename(fileName, path.extname(fileName));
    return fileNameWithoutExtension[0].toUpperCase()
      + fileNameWithoutExtension.substr(1).replace(/-/g, ' ');
  }
};

module.exports = fileNameToString;