'use strict'
var es = require('event-stream');
var gutil = require('gulp-util');
var browserify = require('browserify');
var shim = require('browserify-shim');
var path = require('path');
var fs = require('fs');
var util = require('util');
var stream = require('stream');
var isStream = gutil.isStream;
var isBuffer = gutil.isBuffer;

function error(str) {
	gutil.log('gulp-browserify: ', gutil.colors.red(str));
}


// A readable stream that emits a single buffer.
util.inherits(BufferStream, stream.Readable);

function BufferStream(buffer) {
    stream.Readable.call(this, { objectMode: true });
    this._buffer = buffer;
}

BufferStream.prototype._read = function (size) {
    this.push(this._buffer);
    this.push(null);
};

module.exports = function(opts) {
    var opts = opts || {};
    var ctrOpts = {};
    var buffer = [];
    var bundler, chunk = '';
    var itsABuffer = false;
    var itsAStream = false;
    var lib;

    function bufferContents(file) {
    	buffer.push(file);
    }

    function endStream() {
    	if (buffer.length === 0) return this.emit('end');

    	var self = this;

    	 buffer.map(function (file) {
            if(isStream(file.contents)) {

                itsAStream = true;
               	ctrOpts.basedir = file.base;
                ctrOpts.entries = file.contents;
            }else if(isBuffer(file.contents)) {

                itsABuffer = true;
                ctrOpts.basedir = file.base;
                ctrOpts.entries = new BufferStream(file.contents);
            }else {

                ctrOpts.entries = path.resolve(file.path);
            }

            if(opts.noParse) {
                ctrOpts.noParse = opts.noParse.map(function(filepath) {
                    return path.resolve(filepath);
                })
                delete opts.noParse;
            }

            if(opts.extensions) {
                ctrOpts.extensions = opts.extensions;
                delete opts.extensions;
            }

            if(opts.shim) {
                for(lib in opts.shim) {
                    opts.shim[lib].path = path.resolve(opts.shim[lib].path);
                }
                bundler = shim(browserify(), opts.shim);
                bundler.require(file.path, { entry: true });
            } else {
                bundler = browserify(ctrOpts);
            }

            bundler.on('error', function(err) {
                error(err);
            })

            if(opts.transform) {
                opts.transform.forEach(function(transform) {
                    console.log(file.path);
                    bundler.transform(transform);
                })
            }

            self.emit('prebundle', bundler);

            var onBundleComplete = function(self, err, src) {
                if(err) {
                    error(err);
                    self.emit('error', err);
                    return;
                }

                var newFile = new gutil.File({
                    cwd: file.cwd,
                    base: file.base,
                    path: file.path,
                    contents: new Buffer(src)
                });

                self.emit('postbundle', src);

                self.emit('data', newFile);
                self.emit('end');
            }

            if(itsAStream || itsABuffer ) {
                var readable = bundler.bundle(opts);
                readable.on('data', function(data) {
                    chunk += data;
                }).once('end', function(err) {
                    onBundleComplete(self, err, chunk);
                })
            } else {
                bundler.bundle(opts, function(err, src) {
                    onBundleComplete(self, err, src);
                })
            }
    	});
	}

	return es.through(bufferContents, endStream);
}
