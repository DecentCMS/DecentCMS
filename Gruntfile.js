// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

var buildConfig = require('./lib/sub-grunt-config').buildConfig;
var buildInstallConfig = require('./lib/sub-grunt-config').buildInstallConfig;

module.exports = function gruntDecent(grunt) {
  grunt.initConfig();

  // Execution of Grunt tasks in each module and theme
  grunt.loadNpmTasks('grunt-run-grunt');
  var verbose = grunt.option('verbose');

  var runGruntConfig = {};
  var runTasks = buildConfig('run_grunt', 'default', runGruntConfig, verbose);
  var testTasks = buildConfig('run_grunt', 'test', runGruntConfig, verbose);
  grunt.config.merge({
    run_grunt: runGruntConfig
  });
  // console.log(JSON.stringify(runGruntConfig, null, 2));

  grunt.registerTask(
    'modules',
    'Run all tasks in all modules.',
    runTasks);
  grunt.registerTask(
    'test',
    'Run all tests in all modules.',
    testTasks
  );

  // Installation and update of all modules and themes' dependencies
  var installTask = require('./lib/grunt-install-decent-modules');
  installTask(grunt);
  grunt.config.merge({
    install_decent_modules: {
      all: {
        npmCommand: 'install',
        dependencies: true,
        devDependencies: true
      },
      update_all: {
        npmCommand: 'update',
        dependencies: true,
        devDependencies: true
      },
      install_runtime: {
        npmCommand: 'install',
        dependencies: true,
        devDependencies: false
      }
    }
  });
  grunt.registerTask(
    'install',
    'Install all dependencies of all modules and themes.',
    ['install_decent_modules:all']
  );
  grunt.registerTask(
    'update',
    'Update all dependencies of all modules and themes.',
    ['install_decent_modules:update_all']
  );
  grunt.registerTask(
    'install_runtime',
    'Install only runtime dependencies (not dev dependencies) of all modules and themes.',
    ['install_decent_modules:install_runtime']
  );

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
            src: ['**/img/*.{png,jpg,gif,svg}', '**/media/*.{png,jpg,gif,svg}']
          }
        ]
      }
    }
  });
  grunt.registerTask('images', 'Minimize all images in all folders', 'imagemin');
};