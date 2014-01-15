[![Build Status](https://travis-ci.org/deepak1556/gulp-browserify.png)](https://travis-ci.org/deepak1556/gulp-browserify)
[![NPM version](https://badge.fury.io/js/gulp-browserify.png)](http://badge.fury.io/js/gulp-browserify)

#[gulp](https://github.com/gulpjs/gulp)-browserify

<table>
<tr> 
<td>Package</td><td>gulp-browserify</td>
</tr>
<tr>
<td>Description</td>
<td>Bundle modules with BrowserifyJS</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.8</td>
</tr>
<tr>
<td>Gulp Version</td>
<td>3.x</td>

</tr>
</table>

# Usage


## Install

```
npm install gulp-browserify --save
```

## Example

```javascript
var gulp = require('gulp');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');

// Basic usage
gulp.task('basic', function(){
	gulp.src('./src/*.js')
	.pipe(browserify())
	.pipe(gulp.dest('./build/js'));
});



gulp.task('scripts', function() {
	//single entry point to browserify
	gulp.src(['src/js/*.js'])
		.pipe(browserify({
		  insertGlobals : true,
		  debug : true
		}))
		.pipe(concat('dest.js'))
		.pipe(gulp.dest('./build/js'))
});

gulp.task('default', function() {
	gulp.run('scripts');
});
```

You can view more examples in the [example folder.](https://github.com/stevelacy/gulp-browserify/tree/master/examples)

### Options

#### transform

Type : `[String || function]`

Specifies a pipeline of functions (or modules) through which the browserified bundle will be run. 

Transforms may not support input streams of browserify, since a temporary file is created to hold the contents of the input stream.

For example, coffeeify expects the file input to end with `.coffee` or `.litcoffee` extension. However the temp file create by browserify has a `.js` extension. Instead, use [gulp-coffee](https://github.com/wearefractal/gulp-coffee) to transform the input file contents before piping into gulp-browserify. Or you can stick with coffeeify using `gulp.src('./index.js', { read: false })` to preserve extension and giving `['.coffee', '.litcoffee']` to `extensions` option.

#### debug

Type : `Boolean`

Enable source map support

#### extensions

Type: `[String]`

Array of extensions that you want to skip in `require()` calls in addition to `.js` and `.json`. Don't forget `.`.

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



#License

Copyright (c) 2014 Robo (deepak1556) https://github.com/deepak1556

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
