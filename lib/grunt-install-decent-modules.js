// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
// Some code borrowed from:
// https://github.com/ahutchings/grunt-install-dependencies/blob/master/tasks/install-dependencies.js
'use strict';

var path = require('path');
var fs = require('fs');
var async = require('async');

module.exports = function gruntInstallDecentModules(grunt) {
  var exec = require('child_process').exec;

  grunt.registerMultiTask(
    'install_decent_modules',
    'Scans all module and theme folders and runs npm install on all dependencies, internal or external.',
    function gruntInstallDecentModulesTask() {
      var done = this.async();
      var options = this.data;
      var npmCommand = options.npmCommand || 'install';
      var includeDependencies = options.dependencies;
      var includeDevDependencies = options.devDependencies;
      var folders = options.folders || ['modules', 'themes'];
      var modules = {};

      function forEachModule(iterator, done) {
        async.each(folders,
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
              var manifest = require(manifestPath);
              var modulePath = path.dirname(manifestPath);
              var dependencies =
                (includeDependencies ? Object.getOwnPropertyNames(manifest.dependencies || {}) : [])
                  .concat(includeDevDependencies ? Object.getOwnPropertyNames(manifest.devDependencies || {}) : []);
              async.each(dependencies,
                function forEachDependency(dependency, nextDependency) {
                  var packageDirOrName = modules[dependency] || dependency;
                  var cmd = 'npm ' + npmCommand + ' ' + packageDirOrName;
                  exec(cmd, {cwd: modulePath}, function (err, stdout, stderr) {
                    if (err && options.failOnError) {
                      grunt.log.writeln(stderr);
                      grunt.warn(err);
                    }
                    grunt.log.writeln(modulePath + ': ' + cmd);
                    grunt.log.writeln(stdout);
                    nextDependency();
                  });
                },
                nextModule);
            },
            done)
        });
    });
};