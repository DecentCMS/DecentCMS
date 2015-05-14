// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var scope = require('../lib/scope');

describe('scope', function() {
  it('adds methods', function() {
    var scoped = {};
    scope('', scoped, {});

    expect(scoped)
      .to.respondTo('require')
      .and.to.respondTo('initialize')
      .and.to.respondTo('register')
      .and.to.respondTo('getServices')
      .and.to.respondTo('callService')
      .and.to.respondTo('lifecycle')
      .and.to.respondTo('makeSubScope');
  });

  it('returns the scoped object', function() {
    var theObject = {};
    var scoped = scope('', theObject, {});

    expect(theObject).to.equal(scoped);
  });

  it('retrieves service instances', function() {
    function ServiceClass() {}
    var scoped = scope('', {}, {
      service: [ServiceClass]
    });

    var serviceInstance = scoped.require('service');

    expect(serviceInstance)
      .to.be.an.instanceOf(ServiceClass);
  });

  it('retrieves a different instance every time require is called', function() {
    function ServiceClass() {}
    var scoped = scope('', {}, {
      service: [ServiceClass]
    });

    var serviceInstance1 = scoped.require('service');
    var serviceInstance2 = scoped.require('service');

    expect(serviceInstance1)
      .to.be.an.instanceOf(ServiceClass);
    expect(serviceInstance2)
      .to.be.an.instanceOf(ServiceClass);
    expect(serviceInstance1)
      .to.not.equal(serviceInstance2);
  });

  it('retrieves the same singleton instance every time require is called', function() {
    function ServiceClass() {}
    ServiceClass.isScopeSingleton = true;
    ServiceClass.scope = '';
    var scoped = scope('', {}, {
      service: [ServiceClass]
    });

    var serviceInstance1 = scoped.require('service');
    var serviceInstance2 = scoped.require('service');

    expect(serviceInstance1)
      .to.be.an.instanceOf(ServiceClass)
      .and.to.equal(serviceInstance2);
  });

  it('retrieves different singleton instances from different scopes', function() {
    function ServiceClass() {}
    ServiceClass.isScopeSingleton = true;
    ServiceClass.scope = '';
    var scoped1 = scope('', {}, {
      service: [ServiceClass]
    });
    var scoped2 = scope('', {}, {
      service: [ServiceClass]
    });

    var serviceInstance1 = scoped1.require('service');
    var serviceInstance2 = scoped2.require('service');

    expect(serviceInstance1)
      .to.not.equal(serviceInstance2);
  });

  it('returns the last service from require', function() {
    function ServiceClass1() {}
    function ServiceClass2() {}
    var scoped = scope('', {}, {
      service: [ServiceClass1, ServiceClass2]
    });

    var serviceInstance = scoped.require('service');

    expect(serviceInstance)
      .to.be.an.instanceOf(ServiceClass2);
  });

  it('returns all services from getServices', function() {
    function ServiceClass1() {}
    function ServiceClass2() {}
    var scoped = scope('', {}, {
      service: [ServiceClass1, ServiceClass2]
    });

    var serviceInstances = scoped.getServices('service');

    expect(serviceInstances.length).to.equal(2);
    expect(serviceInstances[0])
      .to.be.an.instanceOf(ServiceClass1);
    expect(serviceInstances[1])
      .to.be.an.instanceOf(ServiceClass2);
  });

  it('returns new instances of services every time from getServices', function() {
    function ServiceClass1() {}
    function ServiceClass2() {}
    var scoped = scope('', {}, {
      service: [ServiceClass1, ServiceClass2]
    });

    var serviceInstances1 = scoped.getServices('service');
    var serviceInstances2 = scoped.getServices('service');

    expect(serviceInstances1[0])
      .to.not.equal(serviceInstances2[0]);
    expect(serviceInstances1[1])
      .to.not.equal(serviceInstances2[1]);
  });

  it('returns the same instances of singleton services every time from getServices', function() {
    function ServiceClass1() {}
    ServiceClass1.isScopeSingleton = true;
    ServiceClass1.scope = '';
    function ServiceClass2() {}
    ServiceClass2.isScopeSingleton = true;
    ServiceClass2.scope = '';
    var scoped = scope('', {}, {
      service: [ServiceClass1, ServiceClass2]
    });

    var serviceInstances1 = scoped.getServices('service');
    var serviceInstances2 = scoped.getServices('service');

    expect(serviceInstances1[0])
      .to.be.an.instanceOf(ServiceClass1)
      .and.to.equal(serviceInstances2[0]);
    expect(serviceInstances1[1])
      .to.be.an.instanceOf(ServiceClass2)
      .and.to.equal(serviceInstances2[1]);
  });

  it('returns singletons from the right scope', function() {
    function ServiceClass(scope) {
      this.scope = scope;
    }
    ServiceClass.isScopeSingleton = true;
    ServiceClass.scope = 'outer';
    var initializedToScope = null;
    ServiceClass.init = function(scope) {
      initializedToScope = scope;
    };
    var outerScope = scope('outer', {}, {
      service: [ServiceClass]
    });
    outerScope.initialize();
    var innerScope = scope('inner', {}, {
      service: [ServiceClass]
    }, outerScope);
    innerScope.initialize();

    expect(initializedToScope).to.equal(outerScope);

    var serviceInstanceFromInner = innerScope.require('service');
    var serviceInstanceFromOuter = outerScope.require('service');

    expect(serviceInstanceFromInner.scope).to.equal(outerScope);
    expect(serviceInstanceFromInner).to.equal(serviceInstanceFromOuter);
  });

  it('returns static instances of static services', function() {
    var StaticService1 = function() {};
    StaticService1.isStatic = true;
    var StaticService2 = {};
    var scoped = scope('', {}, {
      service: [StaticService1, StaticService2]
    });

    var instances = scoped.getServices('service');

    expect(instances[0]).to.equal(StaticService1);
    expect(instances[1]).to.equal(StaticService2);
  });

  it('passes itself as the first parameter of the constructor when building instances, and the options as the second', function() {
    function ServiceClass(scope, options) {
      this.scope = scope;
      this.options = options;
    }
    function SingletonClass(scope, options) {
      this.scope = scope;
      this.options = options;
    }
    SingletonClass.isScopeSingleton = true;
    SingletonClass.scope = '';
    var scoped = scope('', {}, {
      service: [ServiceClass],
      singleton: [SingletonClass],
      both: [ServiceClass, SingletonClass]
    });
    var options = {};

    var instance = scoped.require('service', options);
    expect(instance.scope).to.equal(scoped);
    expect(instance.options).to.equal(options);

    instance = scoped.require('singleton', options);
    expect(instance.scope).to.equal(scoped);
    expect(instance.options).to.equal(options);

    instance = scoped.getServices('both', options);
    expect(instance[0].scope).to.equal(scoped);
    expect(instance[0].options).to.equal(options);
    expect(instance[1].scope).to.equal(scoped);
    expect(instance[1].options).to.equal(options);
  });

  it('registers services', function() {
    var scoped = scope('', {}, {});
    function ServiceClass() {}
    scoped.register('service-class', ServiceClass);
    var instance = scoped.require('service-class');

    expect(instance)
      .to.be.an.instanceOf(ServiceClass);
  });

  it('registers itself as a service', function() {
    var scoped = scope('the-scope', {}, {});
    var instance = scoped.require('the-scope');

    expect(instance).to.equal(scoped);
  });

  it('can create sub-scopes', function() {
    function SuperService() {}
    function SubService() {}
    var superScope = scope('super', {}, {
      'super-service': [SuperService]
    });
    var subScope = superScope.makeSubScope('sub', {});
    subScope.register('sub-service', SubService);

    expect(superScope.require('super')).to.equal(superScope);
    expect(superScope.require('super-service'))
      .to.be.an.instanceOf(SuperService);
    expect(superScope.require('sub-service')).to.not.be.ok;

    expect(subScope.require('sub')).to.equal(subScope);
    expect(subScope.require('super')).to.equal(superScope);
    expect(subScope.require('super-service'))
      .to.be.an.instanceOf(SuperService);
    expect(subScope.require('sub-service'))
      .to.be.an.instanceOf(SubService);
  });

  it('calls services', function(done) {
    var results = [];
    function ServiceClass(scope) {
      this.scope = scope;
    }
    ServiceClass.prototype.method = function(context, next) {
      results.push('service');
      results.push(context.one);
      next();
    };
    function ServiceWithoutMethod(scope) {
      this.scope = scope;
    }
    function SingletonClass(scope) {
      this.scope = scope;
    }
    SingletonClass.prototype.method = function(context, next) {
      results.push('singleton');
      results.push(context.two);
      next();
    };
    SingletonClass.isScopeSingleton = true;
    SingletonClass.scope = '';
    var scoped = scope('', {}, {
      service: [ServiceClass, ServiceWithoutMethod, SingletonClass]
    });

    scoped.callService('service', 'method', {one: 'one', two: 'two'}, function() {
      expect(results).to.deep.equal(['service', 'one', 'singleton', 'two']);
      done();
    });
  });

  it('runs life cycles', function(done) {
    var results = [];
    function ServiceClass(scope) {
      this.scope = scope;
    }
    ServiceClass.prototype.method = function(context, next) {
      results.push('service');
      results.push(context.one);
      next();
    };
    function SingletonClass(scope) {
      this.scope = scope;
    }
    SingletonClass.prototype.method = function(context, next) {
      results.push('singleton');
      results.push(context.two);
      next();
    };
    SingletonClass.isScopeSingleton = true;
    SingletonClass.scope = '';
    var scoped = scope('', {}, {
      service: [ServiceClass, SingletonClass]
    });

    var lifecycle = scoped.lifecycle(
      'service', 'method',
      function(context, next) {
        results.push('anonymous');
        results.push(context.three);
        next();
      },
      'service', 'method'
    );
    lifecycle({one: 'one', two: 'two', three: 'three'}, function() {
      expect(results).to.deep.equal([
        'service', 'one', 'singleton', 'two',
        'anonymous', 'three',
        'service', 'one', 'singleton', 'two'
      ]);
      done();
    });
  });
});