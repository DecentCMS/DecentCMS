// DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.
'use strict';

module.exports = function gruntModule(grunt) {
  var configBridge = grunt.file.readJSON('./bootstrap/grunt/configBridge.json', { encoding: 'utf8' });
  grunt.initConfig({
    pkg: grunt.file.readJSON('./bootstrap/package.json'),
    banner: '/*!\n' +
    ' * Bootstrap v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
    ' * Copyright 2011-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
    ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n' +
    '\n' +
    ' * DecentCMS (c) 2014 Bertrand Le Roy, under MIT. See LICENSE.txt for licensing details.\n' +
    ' */\n',
    jqueryVersionCheck: configBridge.config.jqueryVersionCheck.join('\n')
  });

  // Styles
  grunt.loadNpmTasks('grunt-contrib-less');

  grunt.config.merge({
    less: {
      development: {
        options: {
          banner: '<%= banner %>',
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: 'style.css.map',
          sourceMapFilename: './css/style.css.map'
        },
        files: {
          "./css/style.css": "./less/style.less"
        }
      },
      production: {
        options: {
          banner: '<%= banner %>',
          cleancss: true,
          compress: true,
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: 'css/style.min.css.map',
          sourceMapFilename: './css/style.min.css.map'
        },
        files: {
          "./css/style.min.css": "./less/style.less"
        }
      }
    }
  });

  // Scripts
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.config.merge({
    concat: {
      options: {
        banner: '<%= banner %>\n<%= jqueryVersionCheck %>'
      },
      bootstrap: {
        src: [
          './bootstrap/js/transition.js',
          './bootstrap/js/alert.js',
          './bootstrap/js/button.js',
          './bootstrap/js/carousel.js',
          './bootstrap/js/collapse.js',
          './bootstrap/js/dropdown.js',
          './bootstrap/js/modal.js',
          './bootstrap/js/tooltip.js',
          './bootstrap/js/popover.js',
          './bootstrap/js/scrollspy.js',
          './bootstrap/js/tab.js',
          './bootstrap/js/affix.js',
          './js/theme.js'
        ],
        dest: './js/script.js'
      }
    },
    uglify: {
      options: {
        preserveComments: 'some'
      },
      core: {
        src: './js/script.js',
        dest: './js/script.min.js'
      }
    }
  });
  grunt.registerTask('scripts', ['concat', 'uglify:core']);

  // Fonts
  grunt.config.merge({
    copy: {
      fonts: {
        expand: true,
        cwd: './bootstrap/fonts/',
        src: ['**'],
        dest: './fonts/',
        flatten: true,
        filter: 'isFile'
      }
    }
  });

  // Default task
  grunt.registerTask('default', ['less', 'scripts', 'copy:fonts']);
};