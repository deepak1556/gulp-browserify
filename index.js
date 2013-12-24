'use strict'
var es = require('event-stream');
var gutil = require('gulp-util');
var browserify = require('browserify');
var path = require('path');
var fs = require('fs');
var isStream = gutil.isStream;
var isBuffer = gutil.isBuffer;

function error(str) {
	gutil.log('gulp-browserify: ', gutil.colors.red(str));
}

module.exports = function(opts) {
    var opts = opts || {};
    var ctrOpts = {};
    var buffer = [];
    var bundler, chunk = '';
    var itsABuffer = false;
    var itsAStream = false;

    return es.map(function (file, cb) {
        try {
            if(isStream(file.contents)) {

                itsAStream = true;
                ctrOpts.basedir = file.base;
                ctrOpts.entries = file.contents;
            }else if(isBuffer(file.contents)) {

                itsABuffer = true;
                ctrOpts.basedir = file.base;
                buffer.push(file.contents);
                ctrOpts.entries = es.readArray(buffer);
            }else {

                ctrOpts.entries = path.resolve(file.path);
            }

            if(opts.noParse) {
                ctrOpts.noParse = opts.noParse.map(function(filepath) {
                    return path.resolve(filepath);
                })
                delete opts.noParse;
            }

            bundler = browserify(ctrOpts);
            bundler.on('error', function(err) {
                error(err);
            })

            if(opts.transform) {
                opts.transform.forEach(function(transform) {
                    console.log(file.path);
                    bundler.transform(transform);
                })
            }

            if(opts.preBundleCB) {
                opts.preBundleCB(bundler);
            }

            var onBundleComplete = function(err, src) {
                if(err) {
                    error(err);
                }

                var newFile = new gutil.File({
                    cwd: file.cwd,
                    base: file.base,
                    path: file.path,
                    contents: new Buffer(src)
                });

                cb(null, newFile)
            }

            if(itsAStream || itsABuffer ) {
                var readable = bundler.bundle(opts);
                readable.on('data', function(data) {
                    chunk += data;
                }).once('end', function(err) {
                    if(opts.postBundleCB) {
                        opts.postBundleCB(err, chunk, onBundleComplete)
                    }
                    else {
                        onBundleComplete(err, chunk);
                    }
                })
            } else {
                bundler.bundle(opts, function(err, src) {
                    if(opts.postBundleCB) {
                        opts.postBundleCB(err, src, onBundleComplete)
                    }
                    else {
                        onBundleComplete(err, src);
                    }
                })
            }
        } catch (err) {
            error(err.message);
        }
    });
}
