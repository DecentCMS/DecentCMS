// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';
//TODO: npm update all modules

var buildConfig = require('./lib/sub-grunt-config').buildConfig;

module.exports = function gruntDecent(grunt) {
  grunt.initConfig();

  // Execution of Grunt tasks in each module and theme
  grunt.loadNpmTasks('grunt-run-grunt');
  var verbose = grunt.option('verbose');

  var runGruntConfig = {};
  var runTasks = buildConfig('default', runGruntConfig, verbose);
  var testTasks = buildConfig('test', runGruntConfig, verbose);
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