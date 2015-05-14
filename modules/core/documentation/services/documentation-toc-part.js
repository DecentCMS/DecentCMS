// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

/**
 * Handler for a part that builds a table of contents for documentation.
 * This depends on an index service to be active.
 */
var DocumentationTocPart = {
  feature: 'documentation',
  service: 'shape-handler',
  scope: 'request',
  /**
   * Build a shape for the TOC by querying the index for documentation topics.
   * @param {object} context The context object.
   * @param {object} context.shape The content shape that has the TOC part.
   * @param {object} context.scope The scope.
   * @param {Function} done The callback.
   */
  handle: function documentationTocPart(context, done) {
    var content = context.shape;
    if (!content.meta
      || content.meta.type !== 'content'
      || !content.temp) {
      done();
      return;
    }
    var temp = content.temp;
    var item = temp.item;
    var scope = context.scope;
    var contentManager = scope.require('content-manager');
    var moduleManifests = scope.require('shell').moduleManifests;
    var indexService = scope.require('index');
    if (!indexService) {
      done();
      return;
    }
    var urlHelper = scope.require('url-helper');
    var documentationParts = contentManager.getParts(item, 'documentation-toc');
    var async = require('async');
    async.each(documentationParts,
      function forEachDocumentationPart(partName, next) {

        var shape = item[partName];
        if (!shape) {
          next();
          return;
        }
        //Make the part a proper shape
        shape.meta = {
          type: 'documentation-toc',
          name: partName,
          alternates: ['documentation-toc-' + partName],
          item: item
        };
        shape.temp = {displayType: temp.displayType};
        // Lookup the cache on the request.
        var cachedToc = scope.documentationTOC;
        if (cachedToc) {
          if (temp.shapes) {
            shape.topLevelTOC = cachedToc.topLevelTOC;
            shape.localTOC = cachedToc.localTOC;
            shape.breadcrumbs = cachedToc.breadcrumbs;
            shape.previous = cachedToc.previous;
            shape.next = cachedToc.next;
            shape.current = cachedToc.current;
            temp.shapes.push(shape);
          }
          done();
          return;
        }
        // TODO: have a proper job queue and put that on it.
        // Create or get the index
        var index = indexService.getIndex({
          name: 'documentation-toc',
          idFilter: /^(api)?docs:.*$/,
          map: function mapDocToc(topic) {
            var splitId = topic.id.split(':')[1].split('/');
            var hasModule = moduleManifests.hasOwnProperty(splitId[0]);
            var isIndex = topic.id === 'docs:'
              || (splitId.length < 2 && hasModule)
              || (topic.temp && topic.temp.name && topic.temp.name === 'index' && topic.id.substr(0, 8) !== 'apidocs:');
            var module = hasModule ? splitId[0] : null;
            var area = module ? moduleManifests[module].area : null;
            var section = topic.section || null;
            if (!section) {
              switch(splitId.length) {
                case 3: // /module/section/topic
                  section = splitId[1];
                  break;
                case 2: // /module/section, /module/topic, /section/topic
                  if (module) {
                    if (isIndex) { // /module/section
                      section = splitId[1];
                    }
                    // else /module/topic
                  }
                  else { // /section/topic
                    section = splitId[0];
                  }
                  break;
                case 1: // /, /module, /section, /topic
                  if (isIndex && !module && splitId[0].length > 0) { // /section
                    section = splitId[0];
                  }
                  // else /module or /topic
                  break;
              }
            }
            var topicName = isIndex ? 'index' : splitId[splitId.length - 1];
            return {
              title: topic.title,
              area: area || null,
              module: module,
              name: topicName,
              section: section,
              number: '' + (topic.number || (isIndex ? '0' : '9000')),
              url: urlHelper.getUrl(topic.id)
            };
          },
          orderBy: function orderByAreaModuleSectionNumberName(entry) {
            var result = [];
            result.push(entry.area);
            result.push(entry.module);
            result.push(entry.itemId.substr(0, 3) === 'api' ? 2 : 1);
            result.push(entry.section);
            if (entry.number) {
              Array.prototype.push.apply(result,
                ('' + entry.number).split('.').map(function(n) {return parseInt(n, 10);}));
            }
            if (entry.name) result.push(entry.name);
            return result;
          }
        });
        // use the index to retrieve top-level TOC, local TOC, breadcrumbs,
        // next and previous topics.
        var idForCurrent = scope.itemId;
        var parentIdForLocalTOC = null;
        if (idForCurrent.length > 0) {
          var lastSlashInCurrentId = idForCurrent.lastIndexOf('/');
          if (lastSlashInCurrentId !== -1) {
            parentIdForLocalTOC = idForCurrent.substring(idForCurrent.indexOf(':') + 1, lastSlashInCurrentId);
          }
        }
        var entryForCurrent = null;
        var foundCurrent = false;
        var topLevelTOC = [];
        var localTOC = null;
        var breadcrumbs = [];
        var nextTopic = null;
        var previousTopic = null;
        var module = null;
        var section = null;
        var alreadyStarted = {};
        index.reduce({
            reduce: function buildTOC(val, entry) {
              // update previous, next, and localToc.
              // If current was already found, but next wasn't yet, then this is it.
              if (foundCurrent) {
                if (!nextTopic) {
                  nextTopic = entry;
                }
              }
              else {
                if (idForCurrent === entry.itemId) {
                  // We just found current
                  foundCurrent = true;
                  entryForCurrent = entry;
                  breadcrumbs.push(entry);
                }
                else {
                  // this entry could still be 'previous' if the next looked at
                  // is the current topic being displayed.
                  previousTopic = entry;
                }
              }
              var idWithoutPrefix = entry.itemId.substr(entry.itemId.indexOf(':') + 1);

              if (entry.module && entry.module !== module && !alreadyStarted[entry.module]) {
                // Starting to look at the contents of a new module.
                module = entry.module;
                alreadyStarted[module] = true;
                entry.isModuleIndex = true;
                // If the index topic failed to provide a title, use the module name.
                entry.title = entry.title || moduleManifests[module].friendlyName || module;
                if (!foundCurrent || entryForCurrent === entry) {
                  breadcrumbs = [entry];
                  if (idForCurrent === entry.itemId) {
                    parentIdForLocalTOC = idForCurrent.substr(idForCurrent.indexOf(':') + 1);
                    localTOC = [];
                  }
                  else if (idWithoutPrefix === parentIdForLocalTOC) {
                    localTOC = [];
                  }
                }
                // Reset the section currently being looked at.
                section = null;
              }

              var sectionKey = (entry.module || '') + '/' + (entry.section || '');
              if (entry.section && entry.section != section && entry.section && !alreadyStarted[sectionKey]) {
                // Starting to look at the topics in a new section.
                section = entry.section;
                alreadyStarted[sectionKey] = true;
                entry.isSectionIndex = true;
                // Restart the local TOC if it's not finished building.
                if (!foundCurrent || entryForCurrent === entry) {
                  if (idForCurrent === entry.itemId) {
                    parentIdForLocalTOC = idForCurrent.substr(idForCurrent.indexOf(':') + 1);
                    localTOC = [];
                  }
                  else if (idWithoutPrefix === parentIdForLocalTOC) {
                    localTOC = [];
                    breadcrumbs.push(entry);
                  }
                }
              }

              // Is this topic top-level?
              var isApi = entry.itemId.substr(0, 8) === 'apidocs:';
              var hasNoModuleAndNoSection = !(entry.module || entry.section);
              if (!isApi
                && (hasNoModuleAndNoSection
                || (!entry.module && entry.isSectionIndex)
                || (entry.module && entry.isModuleIndex))) {

                topLevelTOC.push(entry);
              }

              // Push to local TOC if that's not already finished and if the entry belongs there.
              if (localTOC
                && idWithoutPrefix.substr(0, parentIdForLocalTOC.length) === parentIdForLocalTOC
                && idWithoutPrefix.indexOf('/', parentIdForLocalTOC.length + 1) === -1) {
                localTOC.push(entry);
              }

              return 0;
            },
            initialValue: 0
          }, function () {
            // Done building the TOC.
            // If the current topic is a module-less, section-less topic,
            // there's no local TOC.
            if (!entryForCurrent || !(entryForCurrent.module || entryForCurrent.section)) {
              localTOC = [];
            }
            // If the current topic was never found, remove
            // local, breadcrumb and previous.
            if (!foundCurrent) {
              localTOC = [];
              previousTopic = null;
              breadcrumbs = [];
            }
            if (localTOC.length > 0 && (localTOC[0].isSectionIndex || localTOC[0].isModuleIndex)) {
              localTOC.shift();
            }

            // Add new properties to the shape for the TOC components.
            shape.topLevelTOC = topLevelTOC;
            shape.localTOC = localTOC || [];
            shape.breadcrumbs = breadcrumbs;
            shape.previous = previousTopic;
            shape.next = nextTopic;
            shape.current = entryForCurrent;
            // Cache that data on the request
            scope.documentationTOC = {
              topLevelTOC: topLevelTOC,
              localTOC: localTOC,
              breadcrumbs: breadcrumbs,
              previous: previousTopic,
              next: nextTopic,
              current: entryForCurrent
            };
            // Now add this new shape to the list to be rendered.
            temp.shapes.push(shape);
            next();
          }
        );
      }, done
    );
  }
};

module.exports = DocumentationTocPart;