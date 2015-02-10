// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function apiFieldTemplate(apiFieldShape, renderer, done) {
  if (apiFieldShape && apiFieldShape.meta && apiFieldShape.meta.name) {
    renderer
      .startTag('p', {"class": "api-field"})
      .tag('label', null, apiFieldShape.meta.name)
      .write(': ')
      .tag('span', null, apiFieldShape.text)
      .endTag()
      .finally(done)
  }
};