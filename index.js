'use strict'
var es = require('event-stream');
var gutil = require('gulp-util');
var browserify = require('browserify');
var shim = require('browserify-shim');
var path = require('path');
var fs = require('fs');
var util = require('util');
var Readable = require('stream').Readable || require('readable-stream');
var isStream = gutil.isStream;
var isBuffer = gutil.isBuffer;

function error(str) {
	gutil.log('gulp-browserify: ', gutil.colors.red(str));
}

// A readable stream that emits items in a given array.
function ArrayStream(items) {
    Readable.call(this, { objectMode: true });
    this._items = items;
    this._index = 0;
}

util.inherits(ArrayStream, Readable);

ArrayStream.prototype._read = function (size) {
    if (this._index < this._items.length) {
        this.push(this._items[this._index]);
        this._index ++;
    } else {
        this.push(null);
    }
};

module.exports = function(opts) {
    var opts = opts || {};
    var ctrOpts = {};
    var buffer = [];
    var bundler;
    var doneCount = 0;
    var itsABuffer = false;
    var itsAStream = false;
    var lib;

    function bufferContents(file) {
    	buffer.push(file);
    }

    function endStream() {
    	if (buffer.length === 0) return this.emit('end');

    	var self = this;

    	 buffer.forEach(function (file) {
            if(isStream(file.contents)) {

                itsAStream = true;
               	ctrOpts.basedir = file.base;
                ctrOpts.entries = file.contents;
            }else if(isBuffer(file.contents)) {

                itsABuffer = true;
                ctrOpts.basedir = file.base;
                ctrOpts.entries = new ArrayStream([file.contents]);
            }else {

                ctrOpts.entries = path.resolve(file.path);
            }

            if(opts.noParse) {
                ctrOpts.noParse = opts.noParse;
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

            var chunk = '';

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

                if (++doneCount === buffer.length) {
                    self.emit('end');
                }
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
