gulp-browserify
===============

Bundle modules with BrowserifyJS

## Install

```
npm install --save gulp-browserify
```

## Example

```
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');

gulp.task('scripts', function() {
	gulp.src(['./src/index.js'])
		.pipe(browserify())
		.pipe(concat('dest.js'))
		.pipe(gulp.dest('./build'))
});

gulp.task('default', function() {
	gulp.run('scripts');
});
```
