// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: Make Shell a middleware (usable in an Express app)
// TODO: Enable shells to be restarted.
// TODO: Move module loading and service discovery into a separate service, so that shell can deal purely with handling requests.
// TODO: Build file monitoring events so code that caches parsed files can expire and re-parse entries on-the-fly. Make sure that this can be done as an optional feature.

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var fs = require('fs');
var async = require('async');
var scope = require('decent-core-dependency-injection').scope;
var nullServices = require('./null-services');

/**
 * @description
 * A shell is the representation of a tenant in the system.
 * A shell has its own enabled services, that can be required by modules
 * running in its context.
 * 
 * @constructor
 * @param {Object}  options
 * @param {String}  [options.name]          The name of the tenant.
 * @param {String}  [options.rootPath]      The path to the site's folder.
 * @param {String}  [options.settingsPath]  The path to the settings file for this tenant.
 * @param {String}  [options.host]          The host name under which the tenant answers.
 * @param {Number}  [options.port]          The port to which the tenant answers.
 * @param {String}  [options.cert]          The path to the SSL certificate to use with this tenant.
 * @param {String}  [options.key]           The path to the SSL key to use with this tenant.
 * @param {String}  [options.pfx]           The path to the pfx SSL certificate to use with this tenant.
 * @param {Array}   [options.features]      The list of enabled feature names on this tenant.
 * @param {Object}  [options.services]      The enabled services keyed by service name.
 * @param {Object}  [options.types]         The list of content types for this tenant.
 * @param {string}  [options.theme]         The theme to use on this tenant.
 * @param {Array}   [options.staticFolders] The folder names that can serve static contents.
 * @param {Boolean} [options.active]        True if the tenant is active.
 */
function Shell(options) {
  this.settings = options = options || {};
  this.name = options.name;
  this.rootPath = options.rootPath;
  this.settingsPath = options.settingsPath;
  this.host = options.host || 'localhost';
  this.port = options.port || 80;
  this.https = !!options.https;
  this.cert = options.cert;
  this.key = options.key;
  this.pfx = options.pfx;
  this.features = options.features || [];
  this.availableModules = options.availableModules || {};
  this.services = options.services || {};
  this.types = options.types || {};
  this.theme = options.theme;
  this.staticFolders = options.staticFolders || [];
  this.active = !(options.active === false);
  this.serviceManifests = {};
  this.moduleManifests = {};
  this.modules = [];
  this.loaded = false;
}

util.inherits(Shell, EventEmitter);

/**
 * @description
 * An empty shell that you can use to initialize services if you don't need multitenancy.
 */
Shell.empty = new Shell({
  name: "Empty shell"
});

/**
 * @description
 * The list of tenants.
 */
Shell.list = {};

/**
 * @description
 * Creates a shell from its settings file.
 * @param {String} sitePath The path of the settings file.
 * @param {Object} [defaults] Default settings.
 * @returns {Shell} The new shell
 */
Shell.load = function(sitePath, defaults) {
  defaults = defaults || {};
  var settingsPath = path.join(sitePath, 'settings.json');
  var settings = require(settingsPath);
  settings.settingsPath = settingsPath;
  settings.rootPath = sitePath;
  for (var settingName in defaults) {
    if (!(settingName in settings)) {
      settings[settingName] = defaults[settingName];
    }
  }
  return new Shell(settings);
};

/**
 * @description
 * Discovers all tenants in the ./sites directory.
 * 
 * @param {Object} defaults  Default settings for the shells.
 * @param {String} rootPath  The root path where to look for shell settings files.
 *                           Defaults to ./sites
 */
Shell.discover = function(defaults, rootPath) {
  rootPath = rootPath || './sites';
  var siteNames = fs.readdirSync(rootPath);
  siteNames.forEach(function(siteName) {
    var resolvedSitePath = path.resolve(rootPath, siteName);
    try {
      var shell = Shell.load(resolvedSitePath, defaults);
      Shell.list[siteName] = shell;
    }
    catch(ex) {
      ex.path = resolvedSitePath;
      ex.message = 'Failed to load site settings from ' + settingsPath;
      throw ex;
    }
  });
};

/**
 * @description
 * Returns the shell that should handle this request.
 * 
 * @param {IncomingMessage} request The request
 */
Shell.resolve = function(request) {
  for (var shellName in Shell.list) {
    var shell = Shell.list[shellName];

    if (shell.active && shell.canHandle(request)) {
      return shell;
    }
  }
  return null; // Unresolved requests should not go to a default shell
};

/**
 * @description
 * Determines if the shell can handle that request.
 *
 * @param {IncomingMessage} request The request
 * @returns {Boolean} true if the shell can handle the request.
 */
Shell.prototype.canHandle = function(request) {
  var host = request.headers.host;
  return (
    (
      ((this.https && this.port === 443) || this.port === 80)
      && this.host === host
    )
    || (this.host + ':' + this.port === host)
  )
  && (
    !this.path
    || request.url.substr(0, this.path.length) === this.path
  );
};

/**
 * @description
 * Enables or disables the tenant.
 * 
 * @param {Boolean} state If provided, sets the enabled state of the tenant. Otherwise, enables the tenant.
 */
Shell.prototype.enable = function(state) {
  this.active = typeof state === 'undefined' || !!state;
};

/**
 * @description
 * Disables the tenant.
 */
Shell.prototype.disable = function() {
  this.active = false;
};

/**
 * @description
 * Scopes the shell, then loads all enabled services in each module.
 */
Shell.prototype.load = function() {
  if (this.loaded || !this.availableModules) return;
  // Make this a scope
  scope('shell', this);
  // Load services from each available module
  for (var moduleName in this.availableModules) {
    this.loadModule(moduleName);
  }
  this.initialize();
  // The shell exposes itself as a service
  this.register('shell', this);
  // Register null services if no better one exists
  for (var nullServiceName in nullServices) {
    if (!this.services.hasOwnProperty(nullServiceName)) {
      var nullService = nullServices[nullServiceName];
      nullService.isStatic = true;
      this.services[nullServiceName] = [nullService];
    }
  }
  // Mark the shell as loaded
  this.loaded = true;
};

// TODO: replace service manifest with meta-data on the services themselves, auto-discover and load
/**
 * @description
 * Loads all the services in the module under the path passed as a parameter.
 * Services are loaded while respecting the dependency order.
 * 
 * @param {String} moduleName  The name of the module to load.
 */
Shell.prototype.loadModule = function(moduleName) {
  var self = this;
  var manifest = self.availableModules[moduleName];
  // Skip if the module is already loaded
  if (self.moduleManifests[moduleName]) return;
  // Store the manifest, which also flags this module as loaded
  self.moduleManifests[moduleName] = manifest;
  var features = self.features;
  var services = manifest.services;
  var anyEnabledService;
  var moduleServiceClasses = {};
  for (var serviceName in services) {
    var serviceList = services[serviceName];
    if (!Array.isArray(serviceList)) {
      serviceList = [serviceList];
    }
    for (var i = 0; i < serviceList.length ; i++) {
      var service = serviceList[i];
      var serviceFeature = service.feature;
      // Skip if that service is not enabled
      if (serviceFeature && features.indexOf(serviceFeature) === -1) continue;
      var servicePath = path.resolve(manifest.physicalPath, service.path + ".js");
      // Skip if that service is already loaded
      if (self.serviceManifests[servicePath]) continue;
      // Dependencies must be loaded first
      var dependencies = service.dependencies;
      if (dependencies) {
        dependencies.forEach(function (dependencyPath) {
          self.loadModule(dependencyPath);
        });
      }
      // Services are obtained through require
      var ServiceClass = moduleServiceClasses[serviceName] = require(servicePath);
      self.register(serviceName, ServiceClass);
      // Store the manifest on the service class, for reflection, and easy reading of settings
      ServiceClass.manifest = service;
      self.serviceManifests[servicePath] = service;
      anyEnabledService = true;
    }
  }
  // Only add to the modules collection if it has enabled services
  if (anyEnabledService || manifest.theme) {
    self.modules.push(moduleName);
  }
};

/**
 * @description
 * Middleware for use, for example, with Express.
 *
 * @param {http.IncomingMessage} request Request
 * @param {http.ServerResponse}  response Response
 */
Shell.prototype.middleware = function(request, response, next) {
  if (!this.canHandle(request)) {
    next();
    return;
  }
  this.handleRequest(request, response, next);
};

/**
 * @description
 * Handles the request for the tenant
 * Emits the following events:
 * * decent-core-shell-start-request
 * * decent.core.shell.handle-route
 * * decent.core.shell.fetch-content
 * * decent.core.shell.render-error
 * * decent.core.shell.render-page
 * * decent-core-shell-end-request
 *
 * @param {http.IncomingMessage} request Request
 * @param {http.ServerResponse}  response Response
 */
Shell.prototype.handleRequest = function(request, response, next) {
  var self = this;
  // Most events use the same payload structure
  var payload = {
    shell: self,
    request: request,
    response: response
  };
  // Mix-in scope into request
  scope('request', request, self.services);
  // Let services register themselves with the request
  self.emit(Shell.startRequestEvent, payload);
  // Does anyone want to handle this?
  var routeHandlers = this.getServices('route-handler')
    .map(function mapRouteHandlers(routeHandler) {
      return function(callback) {
        routeHandler.handle(payload, callback);
      }
    });
  async.waterfall(
    routeHandlers,
    function routeHandledCallback() {
      // All route handlers have called back, carry on
      self.emit(Shell.fetchContentEvent, {
        shell: self,
        request: request,
        response: response,
        callback: function fetchContentDone(err) {
          if (err) {
            self.emit(Shell.renderErrorPage, err);
            return;
          }
          // Let's render stuff
          self.emit(Shell.renderPageEvent, payload);
          // Tear down
          self.emit(Shell.endRequestEvent, payload);
          request.tearDown();
          response.end('');
          if (next) next();
        }
      });
    }
  );
};

/**
 * @description
 * The event that is broadcast at the beginning of request handling.
 * This is a good time to attach a service to the request object.
 * @type {string}
 */
Shell.startRequestEvent = 'decent-core-shell-start-request';
Shell.startRequestEvent.payload = {
  shell: 'Shell',
  request: 'IncomingMessage',
  response: 'ServerResponse'
};

/**
 * @description
 * The event that is broadcast at the end of request handling.
 * This is a good time to detach services and events.
 * @type {string}
 */
Shell.endRequestEvent = 'decent-core-shell-end-request';
Shell.endRequestEvent.payload = {
  shell: 'Shell',
  request: 'IncomingMessage',
  response: 'ServerResponse'
};

/**
 * @description
 * The event that is broadcast when a route needs to be resolved.
 * @type {string}
 */
Shell.handleRouteEvent = 'decent.core.shell.handle-route';
Shell.handleRouteEvent.payload = {
  shell: 'Shell',
  request: 'IncomingMessage',
  response: 'ServerResponse'
};

/**
 * @description
 * The event that is broadcast when content needs to be fetched from stores.
 * @type {string}
 */
Shell.fetchContentEvent = 'decent.core.shell.fetch-content';
Shell.fetchContentEvent.payload = {
  shell: 'Shell',
  request: 'IncomingMessage',
  response: 'ServerResponse',
  /**
   * @description
   * A callback with signature (err, data).
   */
  callback: 'Function'
};

/**
 * @description
 * The event that is broadcast when the page is ready to be rendered.
 * @type {string}
 */
Shell.renderPageEvent = 'decent.core.shell.render-page';
Shell.renderPageEvent.payload = {
  shell: 'Shell',
  request: 'IncomingMessage',
  response: 'ServerResponse'
};

/**
 * @description
 * This event is triggered when an error has happened during the page lifecycle.
 * @type {string}
 */
Shell.renderErrorPage = 'decent.core.shell.render-error';
/**
 * @description
 * The payload is the error object.
 */
Shell.renderErrorPage.payload = {};

module.exports = Shell;