var gulp = require('gulp');
var browserify = require('../');
var concat = require('gulp-concat');

gulp.task('scripts', function(){
  gulp.src('./src/normal.js')
  .pipe(browserify())
  .pipe(gulp.dest('./build'));
});

gulp.task('bundle', function(){
  gulp.src('./src/*.js')
  .pipe(browserify())
  .pipe(gulp.dest('./bundle'));
});

gulp.task('default', function() {
  gulp.run('scripts');
});