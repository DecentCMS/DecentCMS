// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var DocumentationTocPart = {
  feature: 'documentation',
  service: 'shape-handler',
  scope: 'request',
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
        var cachedToc = scope.documentationToc;
        if (cachedToc) {
          shape.topLevelTOC = cachedToc.topLevelTOC;
          shape.localTOC = cachedToc.localTOC;
          shape.breadcrumbs = cachedToc.breadcrumbs;
          shape.previous = cachedToc.previous;
          shape.next = cachedToc.next;
          shape.current = cachedToc.current;
          temp.shapes.push(shape);
          done();
          return;
        }
        // TODO: have a proper job queue and put that on it.
        // Create or get the index
        var index = indexService.getIndex({
          idFilter: /^(api)?docs:.*$/,
          map: function mapDocToc(topic) {
            var splitId = topic.id.split(':')[1].split('/');
            var hasModule = moduleManifests.hasOwnProperty(splitId[0]);
            var isIndex = splitId.length < 2 && hasModule;
            return {
              title: topic.title,
              module: hasModule ? splitId[0] : null,
              name: splitId.length > 1
                ? splitId[1]
                : isIndex
                ? 'index'
                : splitId[0],
              section: topic.section || null,
              number: topic.number || isIndex ? '0' : '9000',
              url: urlHelper.getUrl(topic.id)
            };
          },
          orderBy: function orderByModuleSectionNumberName(entry) {
            var result = [];
            result.push(entry.module);
            result.push(entry.itemId.substr(0, 3) === 'api' ? 'A' : '0');
            result.push(entry.section);
            if (entry.number) {
              Array.prototype.push.apply(result,
                entry.number.split('.').map(parseInt));
            }
            if (entry.name) result.push(entry.name);
            return result;
          }
        });
        // use the index to retrieve top-level TOC, local TOC, breadcrumbs,
        // next and previous topics.
        var idForCurrent = scope.itemId;
        var entryForCurrent = null;
        var foundCurrent = false;
        var topLevelTOC = [];
        var localTOC = [];
        var lockLocalTOC = false;
        var breadcrumbs = [];
        var nextTopic = null;
        var previousTopic = null;
        var module = null;
        var section = null;
        index.reduce(
          function buildTOC(val, entry) {
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

            if (entry.module && entry.module !== module) {
              // Starting to look at the contents of a new module.
              module = entry.module;
              entry.isModuleIndex = true;
              // If the index topic failed to provide a title, use the module name.
              entry.title = entry.title || moduleManifests[module].friendlyName || module;
              if (!foundCurrent) {
                // The current topic wasn't in the module we just finished before this,
                // so we need to start the breadcrumbs over.
                breadcrumbs = [entry];
                // Restart the local TOC if it's not finished building.
              }
              else if (entryForCurrent === entry) {
                breadcrumbs = [entry];
              }
              if (!lockLocalTOC) {
                if (foundCurrent && entryForCurrent !== entry) {
                  lockLocalTOC = true;
                }
                else {
                  localTOC = [];
                }
              }
              // Reset the section currently being looked at.
              section = null;
            }

            if (entry.section != section) {
              // Starting to look at the topics in a new section.
              section = entry.section;
              entry.isSectionIndex = true;
              if (!foundCurrent) {
                // The current topic wasn't in the section.
                // Restart the local TOC, and push this topic into the breadcrumbs.
                breadcrumbs.push(entry);
              }
              // Restart the local TOC if it's not finished building.
              if (!lockLocalTOC) {
                if (foundCurrent && entryForCurrent !== entry) {
                  lockLocalTOC = true;
                }
                else {
                  localTOC = [];
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
            if (!lockLocalTOC
              && ((foundCurrent
                && entryForCurrent.isModuleIndex
                && entryForCurrent.module === entry.module
                && entryForCurrent !== entry
                && (!entry.section || entry.isSectionIndex))
              || (foundCurrent
                && entryForCurrent.isSectionIndex
                && entryForCurrent.section === entry.section
                && entryForCurrent !== entry)
              || (!foundCurrent
                || (entryForCurrent.module === entry.module
                  && entryForCurrent.section === entry.section))
                && !(entry.isModuleIndex
                  || (entry.isSectionIndex && entryForCurrent.IsModuleIndex)))) {
              localTOC.push(entry);
            }

            return 0;
          },
          0, function () {
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

            // Add new properties to the shape for the TOC components.
            shape.topLevelTOC = topLevelTOC;
            shape.localTOC = localTOC;
            shape.breadcrumbs = breadcrumbs;
            shape.previous = previousTopic;
            shape.next = nextTopic;
            shape.current = entryForCurrent;
            // Cache that data on the request
            scope.documentationToc = {
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