const sass = require('sass-embedded');
module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    patterns: {
      svg: '*.svg'
    },
    startCodepoint: 61440, // 61440 = 0xF000, 61697 = 0xF101
    paths: {
      root: '../',
      sources: 'Sources/',
      sourceSvg: '<%= paths.sources %>Svg/',
      sourceTemplates: '<%= paths.sources %>Templates/',
      resources: '<%= paths.root %>Resources/',
      resourcesPrivate: '<%= paths.resources %>Private/',
      resourcesPublic: '<%= paths.resources %>Public/',
      iconpackTarget: '<%= paths.resourcesPublic %>Iconpack/',
      configurationTarget: '<%= paths.root %>Configuration/Iconpack/'
    },

    // Minify/optimize icons and copy them to target directory
    imagemin: {
      main: {
        options: {
          optimizationLevel: 3,
          // https://svgo.dev/docs/plugins/
          svgoPlugins: [{
            cleanupListOfValues: true
          }, {
            // Converting styles such as style="enable-background:new 0 0 24 24", style="fill:none" to attributes
            // allows plugins such as cleanupEnableBackground, removeUselessStrokeAndFill to do further processing
            convertStyleToAttrs: true
          }, {
            removeOffCanvasPaths: true
          }, {
            removeRasterImages: true
          }, {
            removeScriptElement: true
          }, {
            removeStyleElement: true
          }, {
            removeUselessStrokeAndFill: {
              // Remove elements that have computed fill and stroke equal to "none"
              removeNone: true
            }
          }, {
            removeAttrs: {
              attrs: [
                'clip-rule',
                'fill-rule',
                'overflow',
                'stroke-linejoin',
                'stroke-miterlimit'
              ]
            }
          }, {
            removeViewBox: false
          }, {
            sortAttrs: true
          }],
        },
        files: [{
          expand: true,
          cwd: '<%= paths.sourceSvg %>',
          src: '<%= patterns.svg %>',
          dest: '<%= paths.iconpackTarget %>svgs/'
        }]
      }
    },

    // Create webfont from SVG icons
    webfont: {
      options: {
        stylesheet: 'scss',
        template: '<%= paths.sourceTemplates %>_font.scss',
        htmlDemo: false,
        codepointsFile: '<%= paths.iconpackTarget %>metadata/codepoints.json',
        types: 'woff,woff2,ttf',
        relativeFontPath: '../webfonts/',
        engine: 'fontforge',
        optimize: false,
        autoHint: true,
        version: '<%= pkg.version %>'
      },
      iconpack: {
        src: '<%= paths.iconpackTarget %>svgs/*.svg',
        dest: '<%= paths.iconpackTarget %>webfonts/',
        destScss: '<%= paths.iconpackTarget %>scss/',
        options: {
          font: '<%= pkg.iconpack.key %>',
          fontFamilyName: '<%= pkg.iconpack.family %>',
          fontFilename: '<%= pkg.iconpack.file %>'
        }
      }
    },

    // Create one single SVG Sprite from multiple SVG icons
    svgstore: {
      options: {
        prefix: '',
        formatting: {
          indent_size: 2
        },
        includedemo: false,
        inheritviewbox: true,
        includeTitleElement: false,
        svg: {
          xmlns: 'http://www.w3.org/2000/svg',
          'xmlns:xlink': 'http://www.w3.org/1999/xlink'
        }
      },
      iconpack: {
        files: {
          '<%= paths.iconpackTarget %>sprites/<%= pkg.iconpack.file %>.svg': ['<%= paths.iconpackTarget %>svgs/*.svg']
        }
      }
    },

    // Compile core SCSS
    sass: {
      options: {
        implementation: sass,
        outputStyle: 'expanded',
        precision: 8,
        sourceMap: false,
        silenceDeprecations: [
          'legacy-js-api'
        ]
      },
      main: {
        files: {
          '<%= paths.iconpackTarget %>css/<%= pkg.iconpack.file %>.css': '<%= paths.iconpackTarget %>scss/<%= pkg.iconpack.file %>.scss'
        }
      }
    },

    // Minify CSS
    cssmin: {
      options: {
        keepSpecialComments: '*',
        advanced: false
      },
      main: {
        expand: true,
        cwd: '<%= paths.iconpackTarget %>css/',
        src: ['*.css', '!*.min.css'],
        dest: '<%= paths.iconpackTarget %>css/',
        ext: '.min.css'
      }
    },

    // Minify SVG Sprites
    xmlmin: {
      main: {
        options: {
          preserveComments: false
        },
        files: [{
          expand: true,
          cwd: '<%= paths.iconpackTarget %>sprites/',
          src: ['*.svg'],
          dest: '<%= paths.iconpackTarget %>sprites/'
        }]
      }
    },

    // Cleanup
    clean: {
      ttf: {
        options: {
          force: true
        },
        src: ['<%= paths.iconpackTarget %>webfonts/*-hinted.ttf']
      }
    },

    replace: {
      options: {
        patterns: [
          {
            json: {
              'family': '<%= pkg.iconpack.family %>',
              'file': '<%= pkg.iconpack.file %>',
              'key': '<%= pkg.iconpack.key %>',
              'version': '<%= pkg.iconpack.version %>',
              'ext': '<%= pkg.iconpack.ext %>'
            }
          }
        ]
      },
      iconpack: {
        files: [
          {
            src: '<%= paths.sourceTemplates %>_core.scss',
            dest: '<%= paths.iconpackTarget %>scss/<%= pkg.iconpack.file %>.scss'
          }
        ]
      },
      yaml: {
        files: [
          {
            src: '<%= paths.sourceTemplates %>Iconpack.yaml',
            dest: '<%= paths.configurationTarget %>Iconpack.yaml'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-svgstore');
  grunt.loadNpmTasks('grunt-webfont');
  grunt.loadNpmTasks('grunt-xmlmin');



  /**
   * Create metadata from source icons
   */
  grunt.registerTask('metadata', 'Grunt task to extract metadata from source package.', function () {
    YAML = require('yamljs');

    const sourceSvg = grunt.config('paths.sourceSvg');
    const targetPath = grunt.config('paths.iconpackTarget');
    const pattern = grunt.config('patterns.svg');
    const startCodepoint = grunt.config('startCodepoint');

    let icons = [];
    let count = 0;

    grunt.file.expand({
      cwd: sourceSvg,
      filter: 'isFile',
    }, pattern)
      .forEach(function (sourceFile, index) {
        const icon = getIconFromFilePath(sourceFile);
        if (!(icon in icons)) {
          icons.push(icon);
        }
        count = index + 1;
      });

    // Write metadata
    grunt.file.write(
      targetPath + 'metadata/icons.yml',
      YAML.stringify(icons)
    );

    // Create icon variables for SCSS
    let scssContent = '';
    let codepoints = {};
    let iconVariables = [];
    let iconIdentifier = [];
    Object.values(icons).sort().forEach(function (icon, index) {
      const codepoint = startCodepoint + index
      codepoints[icon] = codepoint;
      iconVariables.push('$' + icon + ': "\\\\' + codepoint.toString(16) + '";');
      iconIdentifier.push('"' + icon + '": $' + icon + ',');
    });
    scssContent += iconVariables.join('\n') + '\n\n';
    scssContent += '$' + 'icons: (\n  ' + iconIdentifier.join('\n  ') + '\n);';
    grunt.file.write(targetPath + 'metadata/codepoints.json', JSON.stringify(codepoints));
    grunt.file.write(targetPath + 'scss/_icons.scss', scssContent);

    grunt.log.write('Processed metadata for ');
    grunt.log.write((count + '').blue);
    grunt.log.writeln(' icons');
  });

  /**
   * Extract icon name from file path
   */
  function getIconFromFilePath(filePath) {
    return filePath.replace(/([^\.]*).*/, "$1").replace(/_/g, '-') ??
      grunt.fail.fatal('Icon name could not be extracted from file path!');
  }



  grunt.registerTask('sprites', ['svgstore', 'xmlmin']);
  grunt.registerTask('webfonts', ['webfont', 'replace', 'sass', 'cssmin']);
  grunt.registerTask('css', ['replace', 'sass', 'cssmin']);

  grunt.registerTask('build', ['imagemin', 'metadata', 'webfont', 'svgstore', 'xmlmin', 'replace', 'sass', 'cssmin', 'clean']);
  grunt.registerTask('default', ['build']);
};
