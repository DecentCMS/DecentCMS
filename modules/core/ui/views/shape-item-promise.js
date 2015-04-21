// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * This template renders nothing because if we get to render this, it
 * means that the promise to get the item was never fulfilled.
 * This happens for example in the case of a 404.
 * @param layout
 * @param renderer
 * @param done
 */
module.exports = function shapeItemPromiseTemplate(layout, renderer, done) {
  done();
};