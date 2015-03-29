// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function documentationEditButtonTemplate(button, renderer, done) {
  renderer
    .tag('a', {href: button.url, 'class': 'btn btn-default btn-xs doc-edit-button', role: 'button'}, button.text)
    .finally(done);
};