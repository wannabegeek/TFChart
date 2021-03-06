module.exports = function(grunt) {
    // 1. All configuration goes here 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        browserify: {
            'libs/3rdparty.js': ['client.js']
        },

        concat: {
            // 2. Configuration for concatinating files goes here.
    	    dist: {
            src: [
                'libs/*.js', // All JS in the libs folder
                //'js/global.js'  // This specific file
            ],
            dest: 'dist/tfchart.js',
            }
        },

        uglify: {
            build: {
                src: 'dist/tfchart.js',
                dest: 'dist/tfchart.min.js'
            }
        },

        watch: {
            scripts: {
                files: ['libs/*.js'],
                tasks: ['concat', 'uglify'],
                options: {
                    spawn: false,
                },
            } 
        }
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-browserify')
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['browserify', 'concat', 'uglify']);

};
