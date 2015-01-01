// DecentCMS (c) 2015 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
var fs = require('fs');
var path = require('path');
var FakeGrunt = require('./fake-grunt');

var moduleRoots = ['./modules', './themes'];

function setupSubGrunt(config, root, task, verbose) {
  var gruntPath = path.resolve(root, 'Gruntfile.js');
  var isGrunt =fs.existsSync(gruntPath);
  var taskName = task ? task + '_' + root : root;
  if (isGrunt) {
    // Harvest list of tasks
    var gruntModule = require(gruntPath);
    var fakeGrunt = new FakeGrunt(path.resolve(root));
    gruntModule(fakeGrunt);
    // Proceed if the task is registered
    if (fakeGrunt.tasks[task]) {
      config[taskName] = {
        src: gruntPath,
        options: {
          task: [task || 'default'],
          verbose: verbose,
          indentLog: ' | ',
          cwd: path.resolve(root)
        }
      };
      return {
        isGrunt: true,
        name: isGrunt ? taskName : null
      };
    }
  }
  return {isGrunt: false};
}

function buildConfig(task, config, verbose) {
  var config = config || {};
  var tasks = [];
  moduleRoots.forEach(function forEachModuleRoot(moduleRoot) {
    var moduleAreaFolders = fs.readdirSync(moduleRoot);
    moduleAreaFolders.forEach(function forEachAreaFolder(areaFolder) {
      var areaPath = path.join(moduleRoot, areaFolder);
      if (fs.statSync(areaPath).isDirectory()) {
        var subGrunt = setupSubGrunt(config, areaPath, task, verbose);
        if (subGrunt.isGrunt) {
          tasks.push('run_grunt:' + subGrunt.name);
        }
        else {
          var moduleFolders = fs.readdirSync(areaPath);
          moduleFolders.forEach(function forEachModuleFolder(moduleFolder) {
            var modulePath = path.join(areaPath, moduleFolder);
            if (fs.statSync(modulePath).isDirectory()) {
              subGrunt = setupSubGrunt(config, modulePath, task, verbose);
              if (subGrunt.isGrunt) {
                tasks.push('run_grunt:' + subGrunt.name);
              }
            }
          });
        }
      }
    });
  });
  return tasks;
}

module.exports = {
  setupSubGrunt: setupSubGrunt,
  buildConfig: buildConfig
};