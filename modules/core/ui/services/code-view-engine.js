// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A view engine where templates are JavaScript functions.
 */
var codeViewEngine = {
  service: 'view-engine',
  feature: 'code-view-engine',
  extension: 'js',
  /**
   * @description
   * Loads the rendering function from the provided path.
   * @param {string} templatePath The path to the JavaScript file.
   * @param {Function} done The callback function to call when the template is loaded.
   * @returns {function} The template function.
   */
  load: function loadCodeTemplate(templatePath, done) {
    done(require(templatePath));
  }
};

module.exports = codeViewEngine;