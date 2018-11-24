// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: Add configurable timeout to request handling.
// TODO: Enable shells to be restarted.
// TODO: Move module loading and service discovery into a separate service, so that shell can deal purely with handling requests.
// TODO: Build file monitoring events so code that caches parsed files can expire and re-parse entries on-the-fly. Make sure that this can be done as an optional feature.

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var fs = require('fs');
var scope = require('decent-injection');
var NullServices = require('./null-services');

/**
 * @description
 * A shell is the representation of a tenant in the system.
 * A shell has its own enabled services, that can be required by modules
 * running in its context.
 * 
 * @constructor
 * @param {Object}  options
 * @param {String}  [options.name]             The name of the tenant.
 * @param {String}  [options.rootPath]         The path to the site's folder.
 * @param {String}  [options.settingsPath]     The path to the settings file for this tenant.
 * @param {String}  [options.host]             The host name under which the tenant answers.
 * @param {String}  [options.debugHost]        A host name under which the tenant answers, that causes `request.debug` to be true.
 * @param {Number}  [options.port]             The port to which the tenant answers.
 * @param {Boolean} [options.https]            True if the site must use HTTPS.
 * @param {String}  [options.cert]             The path to the SSL certificate to use with this tenant.
 * @param {String}  [options.key]              The path to the SSL key to use with this tenant.
 * @param {String}  [options.pfx]              The path to the pfx SSL certificate to use with this tenant.
 * @param {Array}   [options.features]         The list of enabled feature names on this tenant.
 * @param {Object}  [options.availableModules] The list of available module manifests.
 * @param {Object}  [options.services]         The enabled services keyed by service name.
 * @param {Boolean} [options.active]           True if the tenant is active.
 */
function Shell(options) {
  this.settings = options = options || {};
  this.name = options.name;
  this.rootPath = options.rootPath;
  this.settingsPath = options.settingsPath;
  this.host = Array.isArray(options.host)
    ? options.host
    : (options.host ? [options.host] : []);
  this.debugHost = Array.isArray(options.debugHost)
    ? options.debugHost
    : (options.debugHost ? [options.debugHost] : ['localhost']);
  this.port = options.port || 80;
  this.https = !!options.https;
  this.cert = options.cert;
  this.key = options.key;
  this.pfx = options.pfx;
  this.features = options.features || {};
  this.availableModules = options.availableModules || {};
  this.services = options.services || {};
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
  Object.getOwnPropertyNames(defaults)
    .forEach(function(settingName) {
      if (!settings.hasOwnProperty(settingName)) {
        settings[settingName] = defaults[settingName];
      }
    });
  return new Shell(settings);
};

/**
 * @description
 * Discovers all tenants in the ./sites directory.
 * 
 * @param {Object} defaults
 * Default settings for the shells.
 * @param {String} rootPath
 * The root path where to look for shell settings files. Defaults to ./sites
 */
Shell.discover = function(defaults, rootPath) {
  rootPath = rootPath || './sites';
  var siteNames = fs.readdirSync(rootPath);
  siteNames.forEach(function(siteName) {
    if (siteName[0] === '.') return;
    var resolvedSitePath = path.resolve(rootPath, siteName);
    try {
      Shell.list[siteName] = Shell.load(resolvedSitePath, defaults);
    }
    catch(ex) {
      ex.path = resolvedSitePath;
      ex.message = 'Failed to load site settings for ' + siteName;
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
  var shellNames = Object.getOwnPropertyNames(Shell.list);
  // If there's only one shell, always return that.
  if (shellNames.length === 1) return Shell.list[shellNames[0]];
  // Otherwise let each shell decide if it can handle the request.
  for (var i = 0; i < shellNames.length; i++) {
    var shell = Shell.list[shellNames[i]];

    if (shell.active && shell.canHandle(request)) {
      return shell;
    }
  }
  // Unresolved requests should not go to a default shell
  // if there's more than one.
  return null;
};

/**
 * @description
 * Determines if the shell can handle that request.
 *
 * @param request The request
 * @returns {Boolean} true if the shell can handle the request.
 */
Shell.prototype.canHandle = function(request) {
  var host = request.headers.host;
  var hosts = this.host.concat(this.debugHost);
  for (var i = 0; i < hosts.length; i++) {
    var thisHost = hosts[i];
    if ((
      (
      ((this.https && this.port === 443) || this.port === 80 || this.port === '*')
      && thisHost === host
      )
      || (this.port === '*' && host.substr(0, thisHost.length) === thisHost)
      || (thisHost + ':' + this.port === host)
    ) && (
    !this.path
    || request.url.substr(0, this.path.length) === this.path
    )) {
      if (i >= this.host.length) {
        request.debug = true;
      }
      // We also set the shell into debug mode, which could cause problems
      // if the same shell is on a server configured and able to answer on both
      // the host and debug host. That should however never happen.
      this.debug = request.debug;
      // Set the base URL on the request
      request.baseUrl = `http${this.https ? 's' : ''}://${host}`;//${request.hostname}${isDefaultPort ? '': `:${port}`}`;
      return true;
    }
  }
  return false;
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

function moduleSortOrder(moduleName, availableModules) {
  var moduleManifest = availableModules[moduleName];
  if (moduleManifest.hasOwnProperty('priority')) return -moduleManifest.priority;
  if (moduleManifest.theme) return 1;
  return -9999;
}

/**
 * @description
 * Scopes the shell, then loads all enabled services in each module,
 * including modules and themes that are specific to this tenant.
 */
Shell.prototype.load = function() {
  var self = this;
  if (self.loaded || !self.availableModules) return;
  // Make this a scope
  scope('shell', self);
  // Load services from each available module, in priority order, with themes last.
  Object.getOwnPropertyNames(self.availableModules)
    .sort(function(moduleName1, moduleName2) {
      return moduleSortOrder(moduleName1, self.availableModules)
        - moduleSortOrder(moduleName2, self.availableModules);
    })
    .forEach(function(moduleName) {
      self.loadModule(moduleName);
    });
  // Load shell theme if it exists
  if (self.rootPath) {
    var themePath = path.join(self.rootPath, 'theme');
    if (fs.existsSync(themePath)) {
      var discoverModule = require('./module-discovery').discoverModule;
      var theme = discoverModule(themePath, self.availableModules);
      if (theme) self.loadModule(theme.name);
    }
  }
  // Initialize shell and all services
  self.initialize();
  // The shell exposes itself as a service
  self.register('shell', this);
  // Register null services if no better one exists
  Object.getOwnPropertyNames(NullServices)
    .forEach(function(nullServiceName) {
      if (!self.services.hasOwnProperty(nullServiceName)) {
        var nullService = NullServices[nullServiceName];
        nullService.isStatic = true;
        self.services[nullServiceName] = [nullService];
      }
    });
  // Mark the shell as loaded
  self.loaded = true;
};

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
  var anyEnabledService = false;
  var moduleServiceClasses = {};
  if (services) {
    Object.getOwnPropertyNames(services)
      .forEach(function (serviceName) {
        var serviceList = services[serviceName];
        if (!Array.isArray(serviceList)) {
          serviceList = [serviceList];
        }
        for (var i = 0; i < serviceList.length; i++) {
          var service = serviceList[i];
          var serviceFeature = service.feature;
          // Skip if that service is not enabled
          if (serviceFeature && !features.hasOwnProperty(serviceFeature)) continue;
          var servicePath = path.resolve(manifest.physicalPath, service.path);
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
          // Add the service's configuration onto the config object
          self.settings[serviceFeature] = features[serviceFeature];
          // Store the manifest on the service class, for reflection, and easy reading of settings
          ServiceClass.manifest = service;
          self.serviceManifests[servicePath] = service;
          anyEnabledService = true;
        }
      });
  }
  // Only add to the modules collection if it has enabled services
  if (anyEnabledService || (manifest.theme && features.hasOwnProperty(moduleName))) {
    self.modules.push(moduleName);
  }
};

/**
 * @description
 * Middleware for use, for example, with Express.
 *
 * @param {http.IncomingMessage} request Request
 * @param {http.ServerResponse} response Response
 * @param {Function} next The callback.
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
 * Emits the following events and service calls:
 * * decent.core.shell.start-request
 * * 'route-handler'.handle({shell, request, response}, done)
 * * 'storage-manager'.fetchContent({shell, request, response}, done)
 * * 'renderer'.render({shell, request, response}, done)
 * * decent.core.shell.render-error
 * * decent.core.shell.end-request
 *
 * @param request Request
 * @param response Response
 * @param {Function} next The callback
 */
Shell.prototype.handleRequest = function(request, response, next) {
  var self = this;
  var log = self.require('log');
  var profileId = 'shell-handle-request-'
    + (this._profileIndex = (this._profileIndex || 0) + 1);
  log.profile(profileId);
  // Most events use the same context structure
  var context = {
    shell: self,
    request: request,
    response: response
  };
  // Mix-in scope into request
  self.makeSubScope('request', request);
  // Let services register themselves with the request
  self.emit(Shell.startRequestEvent, context);

  var lifecycle = request.lifecycle(
    // Handle the route
    'route-handler', 'handle',
    // Fetch relevant contents from storage
    'storage-manager', 'fetchContent',
    // Render the page
    'renderer', 'render'
  );
  lifecycle(context, function lifecycleDone(err) {
    if (err) {
      self.emit(Shell.renderErrorPage, err);
      log.error(err.message);
      if (next) next(err);
    }
    // Tear down
    self.emit(Shell.endRequestEvent, context);
    if (request.tearDown) request.tearDown();
    log.profile(profileId, 'Handled request', {
      tenant: self.name,
      url: request.url,
      status: response.statusCode
    });
    if (next) next();
  });
};

/**
 * @description
 * The event that is broadcast at the beginning of request handling.
 * This is a good time to attach a service to the request object.
 * @type {string}
 */
Shell.startRequestEvent = 'decent.core.shell.start-request';
Shell.startRequestEvent_payload = {
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
Shell.endRequestEvent = 'decent.core.shell.end-request';
Shell.endRequestEvent_payload = {
  shell: 'Shell',
  request: 'IncomingMessage',
  response: 'ServerResponse'
};

/**
 * @description
 * The event that is broadcast when the page is ready to be rendered.
 * @type {string}
 */
Shell.renderPageEvent = 'decent.core.shell.render-page';
Shell.renderPageEvent_payload = {
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
Shell.renderErrorPage_payload = {};

module.exports = Shell;