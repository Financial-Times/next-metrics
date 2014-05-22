module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    sass: {
      docs: {
        options: {
          style: 'compressed',
          loadPath: './app'
        },
        files: {
          './static/bundle.css': './app/scss/main.scss'
        }
      }
    },
    browserify: {
      dist: {
        files: {
          './static/bundle.js': ['./app/js/main.js'],
        },
        options: {
          transform: ['debowerify', 'textrequireify']
        }
      }
    },
    watch: {
      sass: {
        files: ['./app/scss/**'],
        tasks: ['sass']
      },
      js: {
        files: ['./app/js/**'],
        tasks: ['browserify']
      }
    },
    copy: {
      resources: {
        files: [
          {
            src: '**/*',
            dest: './static/o-ft-header/img/',
            expand: true,
            cwd: './app/o-ft-header/img'
          }
        ]
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['sass', 'browserify', 'copy']);
  grunt.registerTask('js', ['browserify']);
  grunt.registerTask('css', ['sass']);
};
