// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
//TODO: npm update all modules

var fs = require('fs');
var path = require('path');

module.exports = function gruntDecent(grunt) {
  grunt.initConfig();

  // Execution of Grunt tasks in each module and theme
  var moduleRoots = ['./modules', './themes'];

  grunt.loadNpmTasks('grunt-run-grunt');
  var runGruntConfig = {};
  var verbose = grunt.option('verbose');
  var task = grunt.option('run');

  function setupSubGrunt(root, task) {
    var gruntPath = path.resolve(root, 'Gruntfile.js');
    var isGrunt =fs.existsSync(gruntPath);
    if (isGrunt) {
      runGruntConfig[root] = {
        src: gruntPath,
        options: {
          task: [task || 'default'],
          verbose: verbose,
          indentLog: ' | ',
          cwd: path.resolve(root)
        }
      };
    }
    return isGrunt;
  }

  moduleRoots.forEach(function forEachModuleRoot(moduleRoot) {
    var moduleAreaFolders = fs.readdirSync(moduleRoot);
    moduleAreaFolders.forEach(function forEachAreaFolder(areaFolder) {
      var areaPath = path.join(moduleRoot, areaFolder);
      if (fs.statSync(areaPath).isDirectory()) {
        if (!setupSubGrunt(areaPath, task)) {
          var moduleFolders = fs.readdirSync(areaPath);
          moduleFolders.forEach(function forEachModuleFolder(moduleFolder) {
            var modulePath = path.join(areaPath, moduleFolder);
            if (fs.statSync(modulePath).isDirectory()) {
              setupSubGrunt(modulePath, task);
            }
          });
        }
      }
    });
  });
  grunt.config.merge({
    run_grunt: runGruntConfig
  });
  grunt.registerTask(
    'modules',
    'Run all tasks in all modules. Use --run:task-name to target a specific task in each module.',
    'run_grunt');

  // Other top-level Grunt tasks

  // Image minification
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.config.merge({
    imagemin: {
      all: {
        options: {
          optimizationLevel: 7,
          progressive: true
        },
        files: [
          {
            expand: true,
            cwd: './',
            src: ['**/img/*.{png,jpg,gif,svg}']
          }
        ]
      }
    }
  });
  grunt.registerTask('images', 'Minimize all images in all folders', 'imagemin');
};