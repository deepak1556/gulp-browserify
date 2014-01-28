var through = require('through2');
var gutil = require('gulp-util');
var browserify = require('browserify');
var shim = require('browserify-shim');
var path = require('path');
var util = require('util');
var Readable = require('stream').Readable || require('readable-stream');

function arrayStream(items) {
  var index = 0;
  var readable = new Readable({objectMode: true});
  readable._read = function() {
    if(index < items.length) {
      readable.push(items[index]);
      index++;
    } else {
      readable.push(null);
    }
  };
  return readable;
}

module.exports = function(opts, data) {
  if(!opts) opts = {};
  if(!data) data = {};

  ['noParse', 'extensions', 'resolve'].forEach(function(opt) {
    if(opts[opt]) {
      data[opt] = opts[opt];
      delete opts[opt];
    }
  });

  function transform(file, enc, cb) {
    var self = this;

    if (file.isStream()) return cb(new Error('Streams not supported'));

    // browserify accepts file path or stream.

    if(file.isNull()) {
      data.entries = file.path;
    }

    if(file.isBuffer()) {
      data.entries = arrayStream([file.contents]);
    }

    data.basedir = file.base;

    var bundler = browserify(data);

    if(opts.shim) {
      for(var lib in opts.shim) {
          opts.shim[lib].path = path.resolve(opts.shim[lib].path);
      }
      bundler = shim(bundler, opts.shim);
    }

    bundler.on('error', cb);

    if(opts.transform) opts.transform.forEach(function(transform) {
      bundler.transform(transform);
    });

    self.emit('prebundle', bundler);

    var bStream = bundler.bundle(opts, function(err, src) {
      if(err) {
        return cb(err);
      }

      self.emit('postbundle', src);

      file.contents = new Buffer(src);
      self.push(file);
      cb();
    });
  }
  return through.obj(transform);
};
