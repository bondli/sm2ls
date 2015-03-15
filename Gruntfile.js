'use strict';

module.exports = function (grunt) {

  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Define the configuration for all the tasks
  grunt.initConfig({

    //js 压缩
    uglify: {
      options: {
        mangle: true
      },
      js: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: '{,*/}*.js',
            dest: 'dist/'
          }
        ]
      }
    }

  });

  grunt.registerTask('default', ['uglify:js']);

};