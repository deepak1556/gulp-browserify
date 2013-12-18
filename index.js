'use strict'
var es = require('event-stream');
var gutil = require('gulp-util');
var browserify = require('browserify');
var path = require('path');

function error(str) {
	gutil.log('gulp-browserify: ', gutil.colors.red(str));
}

module.exports = function(opts) {
    var opts = opts || {};
    var buffer = '';
    var bundler;

    return es.map(function (file, cb) {
        try {
            bundler = browserify(file.path, opts);
            bundler.bundle().on('data', function(data) {
                buffer += data;
            }).once('end', function() {
            	var newFile = new gutil.File({
      				cwd: file.cwd,
      				base: file.base,
      				contents: new Buffer(buffer)
    			});

    			cb(null, newFile)
            });
        } catch (err) {
            error(err.message);
        }
    });
}
