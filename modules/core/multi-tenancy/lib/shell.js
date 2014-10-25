// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// TODO: Enable shells to be restarted.
// TODO: allow for purely static services.
// TODO: Build file monitoring events so code that caches parsed files can expire and re-parse entries on-the-fly. Make sure that this can be done as an optional feature.

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var fs = require('fs');
var t = require('decent-core-localization').t;

/**
 * @description
 * A shell is the representation of a tenant in the system.
 * A shell has its own enabled services, that can be required by modules
 * running in its context.
 * 
 * @constructor
 * @param {Object}  options
 * @param {String}  [options.name]         The name of the tenant.
 * @param {String}  [options.rootPath]     The path to the site's folder.
 * @param {String}  [options.settingsPath] The path to the settings file for this tenant.
 * @param {String}  [options.host]         The host name under which the tenant answers.
 * @param {Number}  [options.port]         The port to which the tenant answers.
 * @param {String}  [options.cert]         The path to the SSL certificate to use with this tenant.
 * @param {String}  [options.key]          The path to the SSL key to use with this tenant.
 * @param {String}  [options.pfx]          The path to the pfx SSL certificate to use with this tenant.
 * @param {Array}   [options.features]     The list of enabled feature names on this tenant.
 * @param {Object}  [options.services]     The enabled services keyed by service name.
 * @param {Object}  [options.types]        The list of content types for this tenant.
 * @param {Boolean} [options.active]       True if the tenant is active.
 */
function Shell(options) {
  options = options || {};
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
  console.log(t('Loaded site settings from %s', settingsPath));
  return new Shell(settings);
}

/**
 * @description
 * Discovers all tenants in the ./sites directory.
 * 
 * @param {Object} defaults  Default settings for the shells.
 * @param {String} rootPath  The root path where to look for shell settings files.
 *                           Defaults to ./sites
 */
Shell.discover = function(defaults, rootPath) {
  Shell.discoveryStart = new Date();
  rootPath = rootPath || './sites';
  console.log(t('Discovering tenants in %s', rootPath));
  var siteNames = fs.readdirSync(rootPath);
  siteNames.forEach(function(siteName) {
    var resolvedSitePath = path.resolve(rootPath, siteName);
    try {
      var shell = Shell.load(resolvedSitePath, defaults);
      Shell.list[siteName] = shell;
    }
    catch(ex) {
      ex.path = resolvedSitePath;
      ex.message = t('Failed to load site settings from %s.', settingsPath);
      throw ex;
    }
  });
  var elapsed = new Date() - Shell.discoveryStart;
  console.log(t('All tenants discovered in %s ms.', elapsed))
};

/**
 * @description
 * Returns the shell that should handle this request.
 * 
 * @param {IncomingMessage} req The request
 */
Shell.resolve = function(req) {
  for (var shellName in Shell.list) {
    var shell = Shell.list[shellName];

    if (shell.active && shell.canHandle(req)) {
      return shell;
    }
  }
  return null; // Unresolved requests should not go to a default shell
}

/**
 * @description
 * Determines if the shell can handle that request.
 *
 * @param {IncomingMessage} req The request
 * @returns {Boolean} true if the shell can handle the request.
 */
Shell.prototype.canHandle = function(req) {
  var host = req.headers.host;
  return (
    (
      ((this.https && this.port === 443) || this.port === 80)
      && this.host === host
    )
    || (this.host + ':' + this.port === host)
  )
  && (
    !this.path
    || req.url.substr(0, this.path.length) === this.path
  );
}

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
 * Loads all enabled services in each module.
 */
Shell.prototype.load = function() {
  if (this.loaded || !this.availableModules) return;
  for (var moduleName in this.availableModules) {
    this.loadModule(moduleName);
  }
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
  if (self.moduleManifests[moduleName]) return;
  self.moduleManifests[moduleName] = manifest;
  var features = self.features;
  var services = manifest.services;
  var anyEnabledService;
  for (var serviceName in services) {
    var service = services[serviceName];
    var serviceFeature = service.feature;
    if (serviceFeature && features.indexOf(serviceFeature) === -1) continue;
    var servicePath = path.resolve(manifest.physicalPath, service.path + ".js");
    if (self.serviceManifests[servicePath]) continue;
    var dependencies = service.dependencies;
    if (dependencies) {
      dependencies.forEach(function(dependencyPath) {
        self.loadModule(dependencyPath);
      });
    }
    var ServiceClass = require(servicePath);
    if (!self.services[serviceName]) {
      self.services[serviceName] = [ServiceClass];
    }
    else {
      self.services[serviceName].push(ServiceClass);
    }
    ServiceClass.manifest = service;
    self.serviceManifests[servicePath] = service;
    if (ServiceClass.init) {
      ServiceClass.init(self);
    }
    // Wire up declared static event handlers
    if (ServiceClass.on) {
      for (var eventName in ServiceClass.on) {
        (function(ServiceClass, eventName) {
          self.on(eventName, function (payload) {
            ServiceClass.on[eventName](self, payload);
          });
        })(ServiceClass, eventName);
      }
    }
    anyEnabledService = true;
    console.log(t('Loaded service %s from %s', serviceName, servicePath));
  }
  if (anyEnabledService) {
    self.modules.push(moduleName);
  }
};

/**
 * @description
 * Returns an instance of a service implementing the named contract passed as a parameter.
 * If more than one service exists in the tenant for that contract, one instance that
 * has dependencies on any other service for that contract is returned. Do not
 * count on any particular service being returned if that is the case among the ones
 * that have the most dependencies.
 * A new instance is returned every time the function is called.
 * 
 * @param {String} service  The name of the contract for which a service instance is required.
 * @param {object} options Options to pass into the service's constructor.
 * @returns {object} An instance of the service, or null if it wasn't found.
 */
Shell.prototype.require = function(service, options) {
  var services = this.services[service];
  var ServiceClass = Array.isArray(services)
    ? (services.length > 0 ? services[services.length - 1] : null) : null;
  return this.construct(ServiceClass, options);
};

/**
 * @description
 * Constructs an instance of the class passed in.
 * If the class is a shell singleton, the same instance
 * is always returned for any given shell.
 * Shell singletons are classes marked with isShellSingleton = true.
 * Otherwise, a new instance is created on each call.
 * Don't call this directly, it should only be internally used by Shell.
 * @param {Function} ServiceClass The class to instantiate.
 *                                This constructor must always take a shell as its first argument.
 *                                It can also take an optional 'options' argument, unless it's a shell singleton.
 * @param {object} options Options to pass into the service's constructor.
 * @returns {object} An instance of the service, or null if it wasn't found.
 */
Shell.prototype.construct = function(ServiceClass, options) {
  return ServiceClass ?
    ServiceClass.isShellSingleton ?
      ServiceClass.instance ?
        ServiceClass.instance :
        ServiceClass.instance = new ServiceClass(this)
      : new ServiceClass(this, options)
    : null;
};

/**
 * @description
 * Returns a list of service instances that are implementing the named contract passed as a parameter.
 * The services are returned in order of dependency: if service A has a dependency
 * on service B, B is guaranteed to appear earlier in the list.
 * New instances are returned every time the function is called.
 * 
 * @param {String} service The name of the contract for which service instances are required.
 * @param {object} options Options to pass into the services' constructors.
 * @returns {Array} An array of instances of the service.
 */
Shell.prototype.getServices = function(service, options) {
  var self = this;
  if (!(service in self.services)) return [];
  return self.services[service].map(function(service) {
    return self.construct(service, options);
  });
};

/**
 * @description
 * Handles the request for the tenant
 * 
 * @param {http.IncomingMessage} request Request
 * @param {http.ServerResponse}  response Response
 */
Shell.prototype.handleRequest = function(request, response) {
  var self = this;
  request.startTime = new Date();
  var payload = {
    shell: self,
    req: request,
    res: response
  };
  // Let services register themselves with the request
  self.emit(Shell.startRequestEvent, payload);
  // Does anyone want to handle this?
  self.emit(Shell.handleRouteEvent, payload);
  self.emit(Shell.fetchContentEvent, {
    shell: self,
    req: request,
    res: response,
    callback: function(err, data) {
      if (err) {
        self.emit(Shell.renderErrorPage, err);
        return;
      }
      // Let's render stuff
      self.emit(Shell.renderPageEvent, {
        req: payload.req,
        res: payload.res
      });
      // Tear down
      self.emit(Shell.endRequestEvent, payload);
    }
  });
};

// TODO: document event payloads
/**
 * @description
 * The event that is broadcast at the beginning of request handling.
 * This is a good time to attach a service to the request object.
 * @type {string}
 */
Shell.startRequestEvent = Shell.prototype.startRequestEvent = 'decent-core-shell-start-request';

/**
 * @description
 * The event that is broadcast at the end of request handling.
 * This is a good time to detach services and events.
 * @type {string}
 */
Shell.endRequestEvent = Shell.prototype.endRequestEvent = 'decent-core-shell-end-request';

/**
 * @description
 * The event that is broadcast when a route needs to be resolved.
 * @type {string}
 */
Shell.handleRouteEvent = Shell.prototype.handleRouteEvent = 'decent.core.shell.handle-route';

/**
 * @description
 * The event that is broadcast when content needs to be fetched from stores.
 * @type {string}
 */
Shell.fetchContentEvent = Shell.prototype.fetchContentEvent = 'decent.core.shell.fetch-content';

/**
 * @description
 * The event that is broadcast when the page is ready to be rendered.
 * @type {string}
 */
Shell.renderPageEvent = Shell.prototype.renderPageEvent = 'decent.core.shell.render-page';

/**
 * @description
 * This event is triggered when an error has happened during the page lifecycle.
 * @type {string}
 */
Shell.renderErrorPage = Shell.prototype.renderErrorPage = 'decent.core.shell.render-error';

module.exports = Shell;