[gulp](https://github.com/wearefractal/gulp)-browserify
===============

Bundle modules with BrowserifyJS
[![Build Status](https://travis-ci.org/deepak1556/gulp-browserify.png)](https://travis-ci.org/deepak1556/gulp-browserify)

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
	//single entry point to browserify
	gulp.src(['src/index.js'])
		.pipe(browserify({
		  insertGlobals : true,
		  debug : true
		}))
		.pipe(concat('dest.js'))
		.pipe(gulp.dest('./build'))
});

gulp.task('default', function() {
	gulp.run('scripts');
});
```

*Note* : Supports streams too, pass `{buffer : false}` as option to `gulp.src()`

### Options

#### noParse

Type : `[String]`

Array of file paths that Browserify should not attempt to parse for require() statements, which should improve compilation time for large library files that do not need to be parsed.

#### transform

Type : `[String || function]`

Specifies a pipeline of functions (or modules) through which the browserified bundle will be run. Below is an example of transform used with gulp-browserify to automatically compile coffeescript files for use in a bundle:

```
gulp.src(['src/**/*.coffee'])
    .pipe(browserify({
	transform : ['coffeeify'],
	insertGlobals : true,
	debug : true
    }))
```

#### debug

Type : `Boolean`

Enable source map support

#### Other Options

Any other options you provide will be passed through to browserify. This is useful for setting things like `standalone` or `ignoreGlobals`.

### Events

#### prebundle

`.on('prebundle', function(bundler){})`

Event triggered just before invoking `bundler.bundle()` and provides bundler object to work with in the callback.

#### postbundle

`.on('postbundle', function(src){})`

Event triggered after the bundle process is over and provides the bundled data as arguemnt to the callback.
