// DecentCMS (c) 2014 Bertrand Le Roy, under MIT license. See license.txt for licensing details.
'use strict';
var domain = require('domain');
var http = require('http');
var https = require('https');
var cluster = require('cluster');
var moduleDiscovery = require('./modules/core/multi-tenancy/lib/module-discovery');
var Shell = require('./modules/core/multi-tenancy/lib/shell');

var port = +process.env.PORT || 1337;
var host = process.env.IP || "localhost";
var workerCount = +process.env.WorkerCount || 1;
var runInCluster = !!process.env.RunInCluster;

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
  bootDomain.run(function() {
    // TODO: make even booting the shells asynchronous. Incoming requests can be queued until it's done.
    // Discover all modules in the system
    moduleDiscovery.discover();
    // Discover all tenants
    Shell.discover({
      port: port,
      host: host,
      availableModules: moduleDiscovery.modules
    });
    // Load each tenant
    for (var shellName in Shell.list) {
      var shell = Shell.list[shellName];
      shell.load();
    }
  });

  var handler = function(req, res) {
    var d = domain.create();
    d.on('error', function(er) {
      console.error('error', er.stack);
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

        // try to send an error to the request that triggered the problem
        res.statusCode = 500;
        // TODO: let route handlers set headers, including powered by.
        res.setHeader('content-type', 'text/html');
        res.end('Oops, the server choked on this request!\n');
        // TODO: broadcast the error to give loggers a chance to use it.
      } catch (er2) {
        // oh well, not much we can do at this point.
        console.error('Error sending 500!', er2.stack);
      }
    });
    d.add(req);
    d.add(res);
    var shell = Shell.resolve(req);
    d.add(shell);

    // Now run the handler function in the domain.
    d.run(function() {
      shell.handleRequest(req, res);
    });
  };

  var httpServer;
  var httpsServers = {};
  // Listen for each tenant
  for (var shellName in Shell.list) {
    var shell = Shell.list[shellName];
    var server;
    if (shell.https) {
      var sslParamsId = (shell.key || "") + (shell.cert || "") + (shell.pfx || "");
      server = sslParamsId in httpsServers
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
    var hostAndPort = shell.host + ':' + shell.port;
    server._hostsAndPorts = server._hostsAndPorts || {};
    if (!(hostAndPort in server._hostsAndPorts)) {
      server.listen(shell.port, shell.host);
      server._hostsAndPorts[hostAndPort] = true;
      console.log('Tenant %s started on %s:%s.', shellName, shell.host, shell.port);
    }
    else {
      console.log('Tenant %s added to listener on %s:%s.', shellName, shell.host, shell.port);
    }
  }
}
