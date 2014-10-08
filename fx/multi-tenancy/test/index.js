// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';
var expect = require('chai').expect;
var proxyquire = require('proxyquire');

var EventEmitter = require('events').EventEmitter;
var path = require('path');
var IncomingMessage = require('http').IncomingMessage;

var Shell = require('../lib/shell');

var serviceClassFactory = function(index) {
  var i = index;
  var ctor = function(shell) {
    this.shell = shell;
    this.what = 'instance of service ' + i;
  };
  ctor['@noCallThru'] = true;
  return ctor;
};

describe('Shell', function() {
  describe('empty', function() {

    it('is an instance of Shell', function () {
      expect(Shell.empty).to.be.an.instanceof(Shell);
    });

    it('is named "Empty shell"', function () {
      expect(Shell.empty.name).to.equal('Empty shell');
    });
  });
  describe('instance', function() {
    it('has default host, port, https flag, features, available modules, services, and manifests', function() {
      var shell = new Shell();

      expect(shell.host).to.equal('localhost');
      expect(shell.port).to.equal(80);
      expect(shell.https).to.be.false;
      expect(shell.features)
        .to.be.an.instanceof(Array)
        .and.to.be.empty;
      expect(shell.availableModules)
        .to.be.an.instanceof(Object)
        .and.to.be.empty;
      expect(shell.services)
        .to.be.an.instanceof(Object)
        .and.to.be.empty;
      expect(shell.serviceManifests)
        .to.be.an.instanceof(Object)
        .and.to.be.empty;
    });

    it('is an event emitter', function() {
      expect(new Shell()).to.be.an.instanceof(EventEmitter);
    });

    it('can load from a manifest file', function() {
      var stubs = {};
      stubs[path.join('path/to/site', 'settings.json')] = {
        name: 'Site 1',
        features: ['foo', 'bar'],
        '@noCallThru': true
      };
      var PhoniedShell = proxyquire('../lib/shell', stubs);
      var shell = PhoniedShell.load('path/to/site');

      expect(shell.name).to.equal('Site 1');
      expect(shell.features)
        .to.deep.equal(['foo', 'bar']);
    });

    it('uses defaults only when a property is missing from the manifest file', function() {
      var stubs = {};
      stubs[path.join('path/to/site', 'settings.json')] = {
        name: 'Site 1',
        '@noCallThru': true
      };
      var PhoniedShell = proxyquire('../lib/shell', stubs);
      var shell = PhoniedShell.load('path/to/site', {
        name: 'Default Name',
        host: 'Default Host'
      });

      expect(shell.name).to.equal('Site 1');
      expect(shell.host).to.equal('Default Host');
    });

    it('can be discovered from the /sites folder', function() {
      var dir;
      var stubs = {
        fs: {
          readdirSync: function(dirPath) {
            dir = dirPath;
            return ['site1', 'site2'];
          }
        }
      };
      stubs[path.resolve('./sites/site1', 'settings.json')] = {
        name: 'Site 1',
        '@noCallThru': true
      };
      stubs[path.resolve('./sites/site2', 'settings.json')] = {
        name: 'Site 2',
        '@noCallThru': true
      };
      var PhoniedShell = proxyquire('../lib/shell', stubs);
      PhoniedShell.discover();

      expect(PhoniedShell.list)
        .to.have.deep.property('site1.name', 'Site 1')
      expect(PhoniedShell.list)
        .to.have.deep.property('site2.name', 'Site 2');
    });

    it('is resolved by a host match on port 80', function() {
      Shell.list = {
        default: new Shell({name: 'Default shell'}),
        site1: new Shell({
          name: 'Site 1',
          port: 80,
          host: 'tenant1'
        })
      };
      var req = new IncomingMessage();
      req.headers.host = 'tenant1';
      var resolvedShell = Shell.resolve(req);

      expect(resolvedShell.name).to.equal('Site 1');
    });

    it('is resolved by a host match on port 443 if flagged https', function() {
      Shell.list = {
        default: new Shell({name: 'Default shell'}),
        site1: new Shell({
          name: 'Site 1',
          port: 443,
          https: true,
          host: 'tenant1'
        })
      };
      var req = new IncomingMessage();
      req.headers.host = 'tenant1';
      var resolvedShell = Shell.resolve(req);

      expect(resolvedShell.name).to.equal('Site 1');
    });

    it('is resolved by a host and port match', function() {
      Shell.list = {
        default: new Shell({name: 'Default shell'}),
        site1: new Shell({
          name: 'Site 1',
          port: 42,
          host: 'localhost'
        })
      };
      var req = new IncomingMessage();
      req.headers.host = 'localhost:42';
      var resolvedShell = Shell.resolve(req);

      expect(resolvedShell.name).to.equal('Site 1');
    });

    it('is resolved by a host, port, and path match', function() {
      Shell.list = {
        default: new Shell({name: 'Default shell'}),
        site1: new Shell({
          name: 'Site 1',
          port: 80,
          host: 'tenant1',
          path: '/sites/site1'
        })
      };
      var req = new IncomingMessage();
      req.headers.host = 'tenant1';
      req.url = '/sites/site1/path/page';
      var resolvedShell = Shell.resolve(req);

      expect(resolvedShell.name).to.equal('Site 1');
    });

    it('resolves to null if other shells are disabled', function() {
      Shell.list = {
        default: new Shell({name: 'Default shell'}),
        site1: new Shell({
          name: 'Site 1',
          port: 80,
          host: 'tenant1'
        })
      };
      var req = new IncomingMessage();
      req.headers.host = 'tenant1';

      Shell.list.site1.disable();
      var resolvedShell = Shell.resolve(req);
      expect(resolvedShell).to.be.null;
      Shell.list.site1.enable();
      resolvedShell = Shell.resolve(req);
      expect(resolvedShell.name).to.equal('Site 1');
    });

    it('resolves to null when no match', function() {
      Shell.list = {
        default: new Shell({name: 'Default shell'}),
        site1: new Shell({
          name: 'Site 1',
          port: 43,
          host: 'tenant'
        })
      };
      var req = new IncomingMessage();
      req.headers.host = 'tenant:42';
      var resolvedShell = Shell.resolve(req);

      expect(resolvedShell).to.be.null;
    });

    it('can be disabled and enabled', function() {
      var shell = new Shell({active: false});
      expect(shell.active).to.be.false;

      shell = new Shell({active: true});
      expect(shell.active).to.be.true;

      shell = new Shell();
      expect(shell.active).to.be.true;
      shell.disable();
      expect(shell.active).to.be.false;
      shell.enable();
      expect(shell.active).to.be.true;
      shell.enable(false);
      expect(shell.active).to.be.false;
      shell.enable(true);
      expect(shell.active).to.be.true;
    });

    it('can decide to handle requests using custom logic', function() {
      Shell.list = {
        default: new Shell({name: 'Default shell'}),
        site1: new Shell({
          name: 'Site 1'
        })
      };
      Shell.list.site1.canHandle = function() {
        return true;
      }
      var req = new IncomingMessage();
      req.headers.host = 'tenant1';

      var resolvedShell = Shell.resolve(req);
      expect(resolvedShell.name).to.equal('Site 1');
    });

    it('can load a service from a module', function() {
      var ServiceClass1 = serviceClassFactory(1);
      var stubs = {};
      var resolvedPathToService = path.resolve('path/to/module1/lib/service1.js');
      stubs[resolvedPathToService] = ServiceClass1;
      var PhoniedShell = proxyquire('../lib/shell', stubs);
      var shell = new PhoniedShell({
        features: ['feature 1'],
        availableModules: {
          'path/to/module1': {
            name: 'module 1',
            services: {
              service1: {
                feature: 'feature 1',
                path: 'lib/service1'
              }
            }
          }
        }
      });
      shell.loadModule('path/to/module1');

      expect(shell.services)
        .to.have.property('service1')
        .and.that.to.be.an.instanceof(Array);

      var service1Instance = shell.services.service1[0];
      expect(service1Instance)
        .to.have.a.property('what', 'instance of service 1');

      expect(shell.serviceManifests)
        .to.have.a.property(resolvedPathToService)
        .and.that.to.have.a.property('path', 'lib/service1');
    });

    it('won\'t load a service that\'s not available', function() {
      var shell = new Shell({
        features: ['not feature 1', 'not feature 1 either'],
        availableModules: {
          'path/to/module1': {
            name: 'module 1',
            services: {
              service1: {
                feature: 'feature 1',
                path: 'lib/service1'
              }
            }
          }
        }
      });
      shell.loadModule('path/to/module1');

      expect(shell.services)
        .to.not.have.property('service1');
    });

    it('will load multiple services with the same name', function() {
      var stubs = {};
      var resolvedPathToService1 = path.resolve('path/to/module1/lib/service1.js');
      stubs[resolvedPathToService1] = serviceClassFactory(1);
      var resolvedPathToService2 = path.resolve('path/to/module2/lib/service2.js');
      stubs[resolvedPathToService2] = serviceClassFactory(2);
      var resolvedPathToService3 = path.resolve('path/to/module2/lib/service3.js');
      stubs[resolvedPathToService3] = serviceClassFactory(3);

      var PhoniedShell = proxyquire('../lib/shell', stubs);
      var shell = new PhoniedShell({
        features: ['feature 1'],
        availableModules: {
          'path/to/module1': {
            name: 'module 1',
            services: {
              service1: {
                feature: 'feature 1',
                path: 'lib/service1'
              }
            }
          },
          'path/to/module2': {
            name: 'module 2',
            services: {
              service1: {
                feature: 'feature 1',
                path: 'lib/service2'
              },
              service2: {
                feature: 'feature 1',
                path: 'lib/service3'
              }
            }
          }
        }
      });
      shell.load();

      expect(shell.services.service1)
        .to.have.length(2);

      expect(shell.services.service1[0])
        .to.have.a.property('what', 'instance of service 1');
      expect(shell.services.service1[1])
        .to.have.a.property('what', 'instance of service 2');
      expect(shell.services.service2[0])
        .to.have.a.property('what', 'instance of service 3');
    });

    it('will load services in dependency order', function() {
      var stubs = {};
      var resolvedPathToService1 = path.resolve('path/to/module1/lib/service1.js');
      stubs[resolvedPathToService1] = serviceClassFactory(1);
      var resolvedPathToService2 = path.resolve('path/to/module2/lib/service2.js');
      stubs[resolvedPathToService2] = serviceClassFactory(2);
      var resolvedPathToService3 = path.resolve('path/to/module3/lib/service3.js');
      stubs[resolvedPathToService3] = serviceClassFactory(3);

      var PhoniedShell = proxyquire('../lib/shell', stubs);
      var shell = new PhoniedShell({
        features: ['feature 1'],
        availableModules: {
          'path/to/module1': {
            name: 'module 1',
            services: {
              service1: {
                feature: 'feature 1',
                path: 'lib/service1',
                dependencies: ['path/to/module3']
              }
            }
          },
          'path/to/module2': {
            name: 'module 2',
            services: {
              service1: {
                feature: 'feature 1',
                path: 'lib/service2',
                // That will check it won't try to load the same module twice.
                // Don't do that for real.
                dependencies: ['path/to/module1']
              }
            }
          },
          'path/to/module3': {
            name: 'module 3',
            services: {
              service1: {
                feature: 'feature 1',
                path: 'lib/service3',
                dependencies: ['path/to/module2']
              }
            }
          }
        }
      });
      shell.load();

      expect(shell.services.service1)
        .to.have.length(3);

      expect(shell.services.service1[0])
        .to.have.a.property('what', 'instance of service 2');
      expect(shell.services.service1[1])
        .to.have.a.property('what', 'instance of service 3');
      expect(shell.services.service1[2])
        .to.have.a.property('what', 'instance of service 1');
    });

    it('can get and require services', function() {
      var stubs = {};
      var resolvedPathToService1 = path.resolve('path/to/module1/lib/service1.js');
      stubs[resolvedPathToService1] = serviceClassFactory(1);
      var resolvedPathToService2 = path.resolve('path/to/module2/lib/service2.js');
      stubs[resolvedPathToService2] = serviceClassFactory(2);
      var resolvedPathToService3 = path.resolve('path/to/module2/lib/service3.js');
      stubs[resolvedPathToService3] = serviceClassFactory(3);

      var PhoniedShell = proxyquire('../lib/shell', stubs);
      var shell = new PhoniedShell({
        features: ['feature 1'],
        availableModules: {
          'path/to/module1': {
            name: 'module 1',
            services: {
              service1: {
                feature: 'feature 1',
                path: 'lib/service1'
              }
            }
          },
          'path/to/module2': {
            name: 'module 2',
            services: {
              service1: {
                feature: 'feature 1',
                path: 'lib/service2'
              },
              service2: {
                feature: 'feature 1',
                path: 'lib/service3'
              }
            }
          }
        }
      });
      shell.load();

      var services1 = shell.getServices('service1');
      expect(services1).to.have.length(2);
      expect(services1[0]).to.have.a.property('what', 'instance of service 1');
      expect(services1[1]).to.have.a.property('what', 'instance of service 2');

      expect(shell.require('service2'))
        .to.have.a.property('what', 'instance of service 3');
    });
  });
});