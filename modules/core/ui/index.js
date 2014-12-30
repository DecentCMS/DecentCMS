// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';

module.exports = {
  CodeViewEngine: require('./services/code-view-engine'),
  DefaultThemeSelector: require('./services/default-theme-selector'),
  DustViewEngine: require('./services/dust-view-engine'),
  FilePlacementStrategy: require('./services/file-placement-strategy'),
  RenderStream: require('./services/render-stream'),
  Shape: require('./services/shape'),
  ShapeItemPromiseHandler: require('./services/shape-item-promise-handler'),
  TemplateRenderingStrategy: require('./services/template-rendering-strategy'),
  ZoneHandler: require('./services/zone-handler')
};