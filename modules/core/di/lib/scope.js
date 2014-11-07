// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var t = require('decent-core-localization').t;

/**
 * @description
 * Constructs an instance of the class passed in.
 * If the class is static, the same object
 * is always returned.
 * Otherwise, a new instance is created on each call.
 * Don't call this directly, it should only be internally used by scope methods.
 * @param {Function|object} ServiceClass The class to instantiate.
 *  This constructor must always take a scope as its first argument.
 *  It can also take an optional 'options' argument, unless it's a shell singleton.
 * @param {object} options Options to pass into the service's constructor.
 * @returns {object} An instance of the service, or null if it wasn't found.
 */
function construct(scope, ServiceClass, options) {
  return ServiceClass ?
      ServiceClass.isStatic || typeof ServiceClass !== 'function' ?
    ServiceClass : new ServiceClass(scope, options)
    : null;
};

/**
 * @description
 * Gets the instance for a singleton service.
 * This should not be called, except by scope methods.
 * @param {object} scope   The scoped object.
 * @param {string} service The service name.
 * @param {number} index   The index at which the service is cached.
 * @param {object} options The options to pass into the service constructor.
 * @returns {object} The singleton instance.
 */
function getSingleton(scope, service, index, options) {
  var serviceClasses = scope.services[service];
  var instances = scope.instances[service];
  if (!instances) {
    instances = scope.instances[service] = new Array(serviceClasses.length);
  }
  var instance = instances[index];
  if (instance) return instance;
  return instances[index] = construct(scope, serviceClasses[index], options);
}

/**
 * @description
 * Initializes a service by calling its init method, and wiring up
 * its static events.
 * @param ServiceClass
 */
function initializeService(scope, ServiceClass) {
  if (!ServiceClass) return;
  if (ServiceClass.init) {
    ServiceClass.init(scope);
  }
  // Wire up declared static event handlers
  if (ServiceClass.on) {
    for (var eventName in ServiceClass.on) {
      (function(ServiceClass, eventName) {
        scope.on(eventName, function (payload) {
          ServiceClass.on[eventName](scope, payload);
        });
      })(ServiceClass, eventName);
    }
  }
}

/**
 * @description
 * Transforms an object into a scope. The role of a scope is to manage the lifecycle
 * of required services. This mixin adds initialize, register, require, getServices,
 * and tearDown methods that can be used to get service instances that are scoped
 * to the object, live and die with it.
 * @param {string} name          The name of the scope.
 * @param {object} objectToScope The object that must be made a scope.
 * @param {object} services      A map of the services to be made available from require.
 */
function scope(name, objectToScope, services) {
  // TODO: test object init
  if (services) {
    objectToScope.services = services;
  }
  objectToScope.scopeName = name;

  /**
   * @description
   * Initialize services for this scope. This is called automatically if the scope was built
   * with a set of services. Otherwise, it must be called manually.
   */
  objectToScope.initialize = function() {
    if (this.services) {
      // Initialize all services except those that are scoped to some other scope
      for (var serviceName in this.services) {
        var serviceClasses = this.services[serviceName];
        if (!serviceClasses) continue;
        for (var i = 0; i < serviceClasses.length; i++) {
          var ServiceClass = serviceClasses[i];
          if (!ServiceClass.scope || ServiceClass.scope === this.scopeName) {
            initializeService(this, ServiceClass);
          }
        }
      }
      this._scopeInitialized = true;
    }
  };

  /**
   * @description
   * Registers a service into the scope's registry, making it available for require and
   * getServices. This will initialize the service if the scope is already initialized.
   * @param {string} name     The service name implemented by ServiceClass.
   * @param {Function|object} ServiceClass The service constructor,
   *                          or the static service object to register.
   */
  objectToScope.register = function(name, ServiceClass) {
    if (!this.services[name]) {
      this.services[name] = [ServiceClass];
    }
    else {
      this.services[name].push(ServiceClass);
    }
    if (this._scopeInitialized) {
      // Scope has already initialized its services, so any new one that gets added
      // must also be initialized.
      if (!ServiceClass.scope || ServiceClass.scope === objectToScope.scopeName) {
        initializeService(objectToScope, ServiceClass);
      }
    }
  };

  /**
   * @description
   * Returns an instance of a service implementing the named contract passed as a parameter.
   * If more than one service exists for that contract, one instance that
   * has dependencies on any other service for that contract is returned. Do not
   * count on any particular service being returned if that is the case among the ones
   * that have the most dependencies.
   * A new instance is returned every time the function is called, unless the service
   * is static, or if it is a scope singleton.
   *
   * @param {String} service  The name of the contract for which a service instance is required.
   * @param {object} options Options to pass into the service's constructor.
   * @returns {object} An instance of the service, or null if it wasn't found.
   */
  objectToScope.require = function require(service, options) {
    var services = this.services[service];
    var ServiceClass = services && services.length > 0 ?
      services[services.length - 1] : null;
    if (!ServiceClass) return null;
    if (ServiceClass.isScopeSingleton) {
      return getSingleton(this, service, services.length - 1, options);
    }
    return construct(this, ServiceClass, options);
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
  objectToScope.getServices = function getServices(service, options) {
    var self = this;
    if (!(service in self.services)) return [];
    return self.services[service].map(function(ServiceClass, index) {
      if (ServiceClass.isScopeSingleton) {
        return getSingleton(self, service, index, options);
      }
      return construct(self, ServiceClass, options);
    });
  };

  /**
   * @description
   * Removes all the members that were mixed-in by the original call to scope.
   */
  objectToScope.tearDown = function tearDown() {
    delete this.services;
    delete this.instances;
    delete this.require;
    delete this.getServices;
    delete this.tearDown;
    delete this._scopeInitialized;
  };

  objectToScope.instances = {};
  if (services) {
    objectToScope.initialize();
  }

  return objectToScope;
}

module.exports = scope;