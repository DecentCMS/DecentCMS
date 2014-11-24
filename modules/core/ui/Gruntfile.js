// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function gruntModule(grunt) {
  grunt.initConfig();

  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.config.merge({
    mochaTest: {
      test: {
        src: ['test/*.js'],
        options: {
          reporter: 'min'
        }
      }
    }
  });

  grunt.registerTask('test', 'mochaTest');
  grunt.registerTask('default', ['mochaTest']);
};