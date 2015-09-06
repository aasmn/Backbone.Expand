var gulp = require('gulp');
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var less = require('gulp-less');
var LessPluginCleanCSS = require('less-plugin-clean-css');
var cleancss = new LessPluginCleanCSS({ advanced: true });


gulp.task('concat',[],function(){
	return gulp.src('../src/**/*.js')
    .pipe(concat('backbone.expand.js'))
    .pipe(gulp.dest('../dist/'));
});

gulp.task('less', function () {
  return gulp.src('../css/**/*.less')
    .pipe(less({
      plugins: [cleancss]
    }))
    .pipe(gulp.dest('./dist/css/main.css'));
});
gulp.task('html', function () {
  return gulp.src('../*.html')
    .pipe(connect.reload());
});

gulp.task('connect', function () {
  connect.server({
    root: '../',
    livereload: true
  });
});

gulp.task('watch', function () {
  gulp.watch('../src/**/*.js', ['concat','html'])
    .on('change', function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });;
  gulp.watch('../css/**/*.less', ['less','html'])
    .on('change', function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });;
  gulp.watch(['../*.html'], ['html']);

});


gulp.task('default', ['connect','watch']);