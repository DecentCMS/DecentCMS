// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = {
  ContentRouteHandler: require('./services/content-route-handler'),
  PreventTrailingSlashHandler: require('./services/prevent-trailing-slash-route-handler'),
  StaticRouteHandler: require('./services/static-route-handler')
};