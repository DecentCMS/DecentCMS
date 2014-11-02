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
 * Transforms an object into a scope. The role of a scope is to manage the lifecycle
 * of required services. This mixin adds require and getServices method that can be
 * used to get service instances that are scoped to the object, live and die with it.
 * @param {object} objectToScope The object that must be made a scope.
 * @param {object} services A map of the services to be made available from require.
 */
function scope(objectToScope, services) {
  // TODO: expose hook for object init
  if (!objectToScope.services && services) {
    objectToScope.services = services;
  }
  objectToScope.instances = {};

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
  objectToScope.require = function(service, options) {
    var services = this.services[service];
    var ServiceClass = services.length > 0 ?
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
  objectToScope.getServices = function(service, options) {
    var self = this;
    if (!(service in self.services)) return [];
    return self.services[service].map(function(ServiceClass, index) {
      if (ServiceClass.isScopeSingleton) {
        return getSingleton(self, service, index, options);
      }
      return construct(self, ServiceClass, options);
    });
  };

  return objectToScope;
}

module.exports = scope;