var gulp = require('gulp');
var browserify = require('../');
var concat = require('gulp-concat');

gulp.task('scripts', function(){
  //single entry point to browserify
  gulp.src('./src/index.js')
  .pipe(browserify())
  .pipe(concat('output.js'))
  .pipe(gulp.dest('./build'));
});

gulp.task('default', function() {
  gulp.run('scripts');
});