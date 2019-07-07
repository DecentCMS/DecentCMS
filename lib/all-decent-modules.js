// DecentCMS (c) 2018 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
// Some code borrowed from:
// https://github.com/ahutchings/grunt-install-dependencies/blob/master/tasks/install-dependencies.js
'use strict';

var path = require('path');
var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;

/**
 * Scans all module and theme folders and runs an npm command on all dependencies, internal or external.
 */
(function installDecentModules() {
  var folders = ['modules', 'themes'];
  var modules = {};
  var npmCommand = process.argv[3];

  console.log(`Running npm ${npmCommand} on all modules and themes.`);

  function forEachModule(iterator, done) {
    async.eachSeries(folders,
      function forEachFolder(folder, nextFolder) {
        var folderPath = path.resolve(folder);
        fs.readdir(folderPath, function folderRead(err, areasOrModules) {
          async.each(areasOrModules,
            function forEachAreaOrModule(areaOrModule, nextAreaOrModule) {
              var areaOrModulePath = path.join(folderPath, areaOrModule);
              if (!fs.statSync(areaOrModulePath).isDirectory()) {
                nextAreaOrModule();
                return;
              }
              var manifestPath = path.join(areaOrModulePath, 'package.json');
              if (fs.existsSync(manifestPath)) {
                iterator(manifestPath, nextAreaOrModule);
                return;
              }
              fs.readdir(areaOrModulePath, function areaFolderRead(err, moduleFolders) {
                async.each(moduleFolders,
                  function forEachModule(moduleFolder, nextModule) {
                    manifestPath = path.join(areaOrModulePath, moduleFolder, 'package.json');
                    if (fs.existsSync(manifestPath)) {
                      iterator(manifestPath, nextModule);
                    }
                  },
                  nextAreaOrModule);
              });
            },
            nextFolder);
        });
      },
      done);
  }

  // First, explore all modules in order to be able to tell internal references from external ones.
  forEachModule(
    function addModule(manifestPath, nextModule) {
      var manifest = require(manifestPath);
      var moduleName = manifest.name;
      modules[moduleName] = manifestPath;
      nextModule();
    },
    function allModulesRead() {
      // Then, npm install each dependency of each module
      forEachModule(
        function npmInstallDependencies(manifestPath, nextModule) {
          var modulePath = path.dirname(manifestPath);
          var cmd = 'npm ' + npmCommand;
          console.log(`Launching ${cmd} from ${modulePath} ...`);
          exec(cmd, {cwd: modulePath}, function (err, stdout, stderr) {
            if (err) {
              console.log(stderr);
              console.warn(err);
            }
            console.log(modulePath + ': ' + cmd);
            console.log(stdout);
            nextModule();
          });
        },
        function() {
          console.log('Done.');
        }
      );
    }
  );
})();