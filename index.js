'use strict'
var es = require('event-stream');
var gutil = require('gulp-util');
var browserify = require('browserify');
var path = require('path');

function error(str) {
	gutil.log('gulp-browserify: ', gutil.colors.red(str));
}

module.exports = function(opts) {
    var ctrOpts = {};
	var buffer = '';
	var bundler;

    return es.map(function (file, cb) {
        try {
            ctrOpts.entries = path.resolve(file.path);

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
                    contents: new Buffer(src)
                });

                cb(null, newFile)
            }

            bundler.bundle(opts, function(err, src) {
                if(opts.postBundleCB) {
                    opts.postBundleCB(err, src, onBundleComplete)
                }
                else {
                    onBundleComplete(err, src);
                }
            })
        } catch (err) {
            error(err.message);
        }
    });
}