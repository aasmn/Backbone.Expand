var gulp = require('gulp');
var concat = require('gulp-concat');
gulp.task('concat',[],function(){
	return gulp.src('../src/**/*.js')
    .pipe(concat('backbone.expand.js'))
    .pipe(gulp.dest('../dist/'));
});
var less = require('gulp-less');
var LessPluginCleanCSS = require('less-plugin-clean-css'),
    cleancss = new LessPluginCleanCSS({ advanced: true });
gulp.task('less', function () {
  return gulp.src('../css/**/*.less')
    .pipe(less({
      plugins: [cleancss]
    }))
    .pipe(gulp.dest('./dist/css/main.css'));
});

gulp.task('default', [], function() {
  	var watcher = gulp.watch('../src/**/*.js', ['concat']);
	watcher.on('change', function(event) {
	  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
	});

	var watcherless = gulp.watch('../css/**/*.less', ['less']);
	watcherless.on('change', function(event) {
	  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
	});
});