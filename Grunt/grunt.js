module.exports = function(grunt) {
	
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: {
			all: {
				src: ['dist']
			}
		},
		copy: {
			code: {				
				cwd: 'src',
				src: '**',
				dest: 'dist',
				expand: true
			},
			libs: {
				expand: true,
				cwd: 'bower_components',
				src: [
					'jquery/dist/*.{js,map}',
					'{underscore,backbone}/*.{js,map}',
					'requirejs/require.js',
					'requirejs-text/text.js',
					'bootstrap/dist/fonts/**',
					'bootstrap/dist/{css,js}/*.{css,map,js}',
					'jquery-ui/*.js',
					'jquery-ui/ui/i18n/datepicker-zh-CN.js',
					'jquery-ui/themes/smoothness/**',
					'jquery-cookie/*.js',
					'select2/dist/{css,js}/*',
					'bootstrap-table/dist/bootstrap-table.min.css',
					'bootstrap-table/dist/bootstrap-table-all.min.js',
					'bootstrap-table/dist/bootstrap-table.min.js',
					'bootstrap-table/dist/locale/bootstrap-table-zh-CN.min.js'
					],
				dest: 'dist/libs'
			}
		},
		concat: {
			options: {
				// define a string to put between each file in the concatenated output
				separator: ';'
			},
			dist: {
				// the files to concatenate
				src: ['src/**/*.js'],
				// the location of the resulting JS file
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'js/*.js',
				dest: 'dist/<%= pkg.name %>.min.js'
			}
		},
		qunit: {
			files: ['test/**/*.html']
		},
		jshint: {
			files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
			options: {
				globals: {
				  jQuery: true
				}
			}
		},
		watch: {
			
			livereload: {
				options: {
					livereload: '<%=connect.server.options.livereload%>'
				},
				files: ['src/**/*.js','src/**/*.html','src/**/*.css'],
				tasks: ['jshint','copy:code']
			}
		},
		connect: {
			
			server: {
				
				options: {
					hostname: '*', //默认就是这个值，可配置为本机某个 IP，localhost 或域名
					open: true,
					port: 8089,
					base: 'dist',
					livereload: 35729,
					middleware: function (connect, options) {
						var proxySnippet = require('grunt-connect-proxy/lib/utils').proxyRequest;
						return [
							  proxySnippet,
							  connect.static(options.base[0]),
							  connect.directory(options.base[0])
						];
					}
				},
				proxies: [
				   
						{
						  context: '/api/v1/',
						  host: '114.215.206.91',
						  port: 8089,
						  https: false,
						  changeOrigin: true,
						  // rewrite: {
							// '^/api': '/'
						  // }
						}
				]

			}

		},
		bower: {
			install: {
			  options: {
				targetDir: './dist/libs',
				layout: 'byComponent',
				install: true,
				verbose: false,
				cleanTargetDir: true,
				cleanBowerDir: false,
				bowerOptions: {}
			  }
			}
	  }
	});
	// Load the plugins.
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-connect-proxy');
	grunt.loadNpmTasks('grunt-bower-task');
	
	// Register task(s).
	grunt.registerTask('help','Help',function(){
		grunt.log.writeln(' Usage: > grunt ');
	});
	grunt.registerTask('check', ['jshint']);
	grunt.registerTask('build',['jshint','clean','copy']);
	grunt.registerTask('default', 'Start a Web Server for Development.', function (target) {
        grunt.task.run([

            'configureProxies:server',
            'connect:server',
            'watch'
        ]);
    });
	
};
