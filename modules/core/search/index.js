// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = {
  Index: require('./services/index'),
  FileIndex: require('./services/file-index'),
  SearchPart: require('./services/search-part'),
  LunrSearch: require('./services/lunr-search')
};