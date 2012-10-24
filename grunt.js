/*global module:false*/
module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    server: {
      port: 8000,
      base: '.'
    },
    pkg: '<json:aol-slideshow.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', '<file_strip_banner:src/<%= pkg.name %>.js>'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    min: {
      'photogallery-1.0': {
        //src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        src: ['<banner:meta.banner>', 'src/jquery.aolphotogallery-1.0.js'],
        //dest: 'dist/<%= pkg.name %>.min.js'
        dest: 'dist/jquery.aolphotogallery-1.0.min.js'
      },
      photogallery: {
        //src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        src: ['<banner:meta.banner>', 'src/jquery.aolphotogallery.js'],
        //dest: 'dist/<%= pkg.name %>.min.js'
        dest: 'dist/jquery.aolphotogallery.min.js'
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    lint: {
      //files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
      files: ['grunt.js', 'src/jquery.aolphotogallery.js']
    },
    compass: {
      dev: {
        src: 'assets/scss',
        dest: 'assets/css',
        linecomments: true,
        forcecompile: true,
        debugsass: true,
        relativeassets: true,
        images: 'assets/images'
      },
      dist: {
        src: 'assets/scss',
        dest: 'dist/css',
        outputstyle: 'compressed',
        linecomments: false,
        forcecompile: true,
        debugsass: false,
        relativeassets: true,
        images: 'assets/images'
      }
    },
    watch: {
      files: ['<config:lint.files>', 'assets/scss/**/*.scss'],
      tasks: 'default'
    },
    jshint: {
      options: {
        "curly": true,
        "eqeqeq": true,
        "immed": true,
        "latedef": true,
        "newcap": true,
        "noarg": true,
        "sub": true,
        "undef": true,
        "boss": true,
        "eqnull": true,
        "browser": true,
        "white": true,
        "devel": true,
        "indent": 2,
        "jquery": true
      },
      globals: {
        jQuery: true
      }
    },
    uglify: {}
  });

  grunt.loadNpmTasks('grunt-compass');
  // Doesn't seem ready for primetime. We'll want to move to this eventually,
  // though.
  //grunt.loadNpmTasks('grunt-contrib-compass');

  // Default task.
  //grunt.registerTask('default', 'lint qunit concat min');
  grunt.registerTask('default', 'lint qunit min compass');
  grunt.registerTask('watch-serve', 'server watch');

};
