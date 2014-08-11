module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    watch: {
      js: {
        files: ['./app/js/**'],
        tasks: ['browserify']
      }
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['lint']);
};
