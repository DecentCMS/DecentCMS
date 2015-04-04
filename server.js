// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';

// TODO: move all require statements closer to usage in order to speed up startup time. Services are required when the server boots, which slows down things for complex dependencies.

var domain = require('domain');
var http = require('http');
var https = require('https');
var cluster = require('cluster');
var moduleDiscovery = require('./modules/core/multi-tenancy/lib/module-discovery');

var Alias = require('require-alias');

global.alias = new Alias({
  aliases: {
    '@root' : './',
    '@decent-core-dependency-injection' : './modules/core/di/index'
  }
});

var Shell = require('./modules/core/multi-tenancy/lib/shell');


var port = process.env.PORT || 1337;
var host = process.env.IP;
var workerCount = +process.env.WorkerCount || 1;
var runInCluster = !!process.env.RunInCluster;

// configure some paths...
/*require.config({
  paths : {
    "decent-core-dependency-injection" : "./modules/core/di/lib/scope"
  }
});*/


if (runInCluster && cluster.isMaster) {
  for (var i = 0; i < workerCount; i++) {
    cluster.fork();
  }

  cluster.on('disconnect', function() {
    console.error('Worker disconnected');
    cluster.fork();
  });
} else {
  var bootDomain = domain.create();
  bootDomain.on('error', function(err) {
    console.error('Error at boot', err.stack || err.message || err);
  });
  bootDomain.run(function() {
    // TODO: make even booting the shells asynchronous. Incoming requests can be queued until it's done.
    // Discover all modules in the system
    var availableModules = moduleDiscovery.discover();
    // Discover all tenants
    Shell.discover({
      port: port,
      host: host,
      availableModules: availableModules
    });
    // Load each tenant
    for (var shellName in Shell.list) {
      var shell = Shell.list[shellName];
      shell.load();
    }
  });

  var handler = function(req, res) {
    var d = domain.create();
    d.on('error', function(err) {
      console.error('Unrecoverable error', err.stack || err.message || err);
      try {
        // Close down within 30 seconds
        var killTimer = setTimeout(function() {
          process.exit(1);
        }, 30000);
        // But don't keep the process open just for that!
        killTimer.unref();

        // stop taking new requests.
        httpServer.close();

        // Let the master know we're dead.  This will trigger a
        // 'disconnect' in the cluster master, and then it will fork
        // a new worker.
        if (runInCluster) {
          cluster.worker.disconnect();
        }
        if (res && !res.finished) {
          // try to send an error to the request that triggered the problem
          res.statusCode = 500;
          // TODO: let route handlers set headers, including powered by.
          res.end('Oops, the server choked on this request!\n');
          // TODO: broadcast the error to give loggers a chance to use it.
        }
      } catch (er2) {
        // oh well, not much we can do at this point.
        console.error('Error sending 500!', er2.stack);
        return;
      }
    });
    d.add(req);
    d.add(res);
    var shell = Shell.resolve(req);
    if (!shell) {
      console.error('Could not resolve shell.', {url: req.url, host: req.headers.host});
      return;
    }
    d.add(shell);

    // Now run the handler function in the domain.
    d.run(function() {
      shell.handleRequest(req, res, function() {
        res.end('');
      });
    });
  };

  var httpServer;
  var httpsServers = {};
  var server;

  // If iisnode, only create one server
  if (process.env.IISNODE_VERSION && port.substr(0, 9) === '\\\\.\\pipe\\') {
    server = httpServer = httpServer || http.createServer(handler);
    server.listen(port);
    return;
  }
  // Listen for each tenant
  for (var shellName in Shell.list) {
    var shell = Shell.list[shellName];
    var hosts = Array.isArray(shell.host) ? shell.host : [shell.host];
    for (i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      if (shell.https) {
        var sslParamsId = (shell.key || "") + (shell.cert || "") + (shell.pfx || "");
        server = httpsServers.hasOwnProperty(sslParamsId)
          ? httpsServers[sslParamsId]
          : httpsServers[sslParamsId] = https.createServer({
          key: shell.key,
          cert: shell.cert,
          pfx: shell.pfx
        }, handler);
      }
      else {
        server = httpServer = httpServer || http.createServer(handler);
      }
      var currentPort = shell.port !== '*' ? shell.port : port;
      server._portsInUse = server._portsInUse || {};
      if (!server._portsInUse.hasOwnProperty('p' + currentPort)) {
        server._portsInUse['p' + currentPort] = true;
        server.listen(currentPort);
      }
    }
  }
}
