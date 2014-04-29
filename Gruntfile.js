module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    sass: {
      docs: {
        options: {
          style: 'compressed',
          loadPath: './src'
        },
        files: {
          './static/bundle.css': './src/scss/main.scss'
        }
      }
    },
    browserify: {
      dist: {
        files: {
          './static/bundle.js': ['./src/js/main.js'],
        },
        options: {
          transform: ['debowerify', 'textrequireify']
        }
      }
    },
    watch: {
      sass: {
        files: ['./src/scss/**'],
        tasks: ['sass']
      },
      js: {
        files: ['./src/js/**'],
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
            cwd: './src/o-ft-header/img'
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
  grunt.registerTask('default', ['sass', 'browserify']);
  grunt.registerTask('js', ['browserify']);
  grunt.registerTask('css', ['sass']);
};