// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

// This grunt file can be copied into the root of any module or theme
// as its Gruntfile.js to provide a simple mocha test run.
// It can then be modified at will.
// The root Gruntfile in the application will know how to find this file
// and run it when you run a "grunt modules" command from the root.
module.exports = function gruntModule(grunt) {
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    mochaTest: {
      test: {
        src: ['test/*.js']
      }
    }
  });

  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('default', ['mochaTest']);
};