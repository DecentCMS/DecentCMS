// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function dateTemplate(datePart, renderer, done) {
  renderer
    .tag('time', {datetime: datePart.date}, datePart.date.toLocaleString(datePart.locale, datePart.options))
    .finally(done);
};