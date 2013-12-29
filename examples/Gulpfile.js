var gulp = require('gulp');
var browserify = require('../');
var concat = require('gulp-concat');

gulp.task('scripts', function(){
  //single entry point to browserify
  gulp.src('./src/index.js')
  .pipe(browserify({
    insertGlobals : true,
    debug : true
  }))
  .pipe(concat('dest.js'))
  .pipe(gulp.dest('./build'));
});

gulp.task('default', function() {
  gulp.run('scripts');
});