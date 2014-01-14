[gulp](https://github.com/wearefractal/gulp)-browserify
===============

Bundle modules with BrowserifyJS
[![Build Status](https://travis-ci.org/deepak1556/gulp-browserify.png)](https://travis-ci.org/deepak1556/gulp-browserify)

## Install

```
npm install --save gulp-browserify
```

## Example

```javascript
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

Specifies a pipeline of functions (or modules) through which the browserified bundle will be run. 

Transforms may not support input streams of browserify, since a temporary file is created to hold the contents of the input stream.

For example, coffeeify expects the file input to end with `.coffee` or `.litcoffee` extension. However the temp file create by browserify has a `.js` extension. Instead, use [gulp-coffee](https://github.com/wearefractal/gulp-coffee) to transform the input file contents before piping into gulp-browserify.

#### debug

Type : `Boolean`

Enable source map support

#### Other Options

Any other options you provide will be passed through to browserify. This is useful for setting things like `standalone` or `ignoreGlobals`.

### Browserify-Shim

```javascript
gulp.task('scripts', function() {
	//single entry point to browserify
	gulp.src(['src/index.js'])
		.pipe(browserify({
		  shim : {
		    lib : {
		  		path : `/path/to/shimfile`
		  		exports : 
		    }
		  }
		}))
		.pipe(concat('dest.js'))
		.pipe(gulp.dest('./build'))
});

```

### Events

Other than standard Node.js stream events, gulp-browserify emit its own events.

#### prebundle

```javascript
.on('prebundle', function(bundler){})
```

Event triggered just before invoking `bundler.bundle()` and provides bundler object to work with in the callback.

#### postbundle

```javascript
.on('postbundle', function(src){})
```

Event triggered after the bundle process is over and provides the bundled data as arguemnt to the callback.
