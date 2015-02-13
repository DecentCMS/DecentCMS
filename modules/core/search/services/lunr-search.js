// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * @description
 * A lightweight search engine suitable for small sites, based on lunr.js.
 * Larger sites should build search on external indexing and search
 * services.
 * @constructor
 */
function LunrSearch(scope) {
  this.scope = scope;
}
LunrSearch.feature = 'lunr-search';
LunrSearch.service = 'search-engine';
LunrSearch.scope = 'shell';

LunrSearch.prototype.index = function() {};

module.exports = LunrSearch;