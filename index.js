'use strict'
var Stream = require('stream');
var gutil = require('gulp-util');
var browserify = require('browserify');
var path = require('path');

var PLUGIN_NAME = 'gulp-browserify';

function gulpBrowserify(opts) {
    var opts = opts || {};
    var bufferMode = false;

    var stream = new Stream.Transform({objectMode: true});

    stream._transform = function(file, unused, done) {
        if(file.isNull()) return done(); // Do nothing

        // Convert buffer to stream
        if(file.isBuffer()) {
            file.contents = file.pipe(new Stream.PassThrough());
            bufferMode = true;
        }

        // Create the bundler
        var bundler = new browserify([
                file.isStream() ?
                    file.contents :
                    file.pipe(new Stream.PassThrough())
            ], {
            basedir: file.base,
            noParse: (opts.noParse || []).map(function(filepath) {
                return path.resolve(filepath);
            })
        });
        delete opts.noParse;

        bundler.on('error', function(err) {
            stream.emit('error', gutil.PluginError(PLUGIN_NAME, err));
        });
        
        (opts.transform || []).forEach(function(transform) {
            bundler.transform(transform);
        });
        delete opts.transform;

        // Emit a prebundle event
        stream.emit('prebundle', bundler);

        // Create the new file
        var newFile = new gutil.File({
            cwd: file.cwd,
            base: file.base
        });

        // Setting file contents
        if(bufferMode) {
            newFile.contents = Buffer('');
            bundler.bundle(opts).on('error', function() {
              stream.emit('error', gutil.PluginError(PLUGIN_NAME, err));
            }).on('data', function(chunk) {
                newFile.contents = Buffer.concat([newFile.contents, Buffer(chunk)],
                    newFile.contents.length + chunk.length);
            }).once('end', function() {
                stream.emit('postbundle', newFile.contents.toString('utf-8'));
                stream.push(newFile);
                done();
            });
        } else {
            newFile.contents = bundler.bundle(opts);
            newFile.contents.on('error', function() {
              stream.emit('error', gutil.PluginError(PLUGIN_NAME, err));
            })
            stream.push(newFile);
            done();
        }

    };

    stream._flush = function(done) {
      stream.emit('end');
      done();
    };

	  return stream;
}

module.exports = gulpBrowserify;
