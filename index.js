var es = require('event-stream');
var through = require('through2');
var gutil = require('gulp-util');
var browserify = require('browserify');
var shim = require('browserify-shim');
var path = require('path');
var util = require('util');
var Readable = require('stream').Readable || require('readable-stream');

function ArrayStream(items) {
  Readable.call(this, {objectMode : true});
  this._items = items;
  this._index = 0;
}

util.inherits(ArrayStream, Readable);

ArrayStream.prototype._read = function() {
  if(this._index < this._items.length) {
    this.push(this._items[this._index]);
    this._index++;
  } else {
    this.push(null);
  }
}

module.exports = function(opts, data) {
  if(!opts) opts = {};
  if(!data) data = {};

  if(opts.noParse) {
      data.noParse = opts.noParse;
      delete opts.noParse;
  }

  if(opts.extensions) {
      data.extensions = opts.extensions;
      delete opts.extensions;
  }

  function transform(file, enc, cb) {
    var self = this;

    if (file.isStream()) return cb(new Error('Streams not supported'));

    // browserify accepts file path or stream.

    if(file.isNull()) {
      data.entries = file.path;
    }

    if(file.isBuffer()) {
      data.entries = new ArrayStream([file.contents]);
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

    if(opts.transform) opts.transform.forEach(function(transform){
      bundler.transform(transform);
    });

    self.emit('prebundle', bundler);

    var bStream = bundler.bundle(opts);
    bStream.on('error', cb);
    bStream.pipe(es.wait(function(err, src){
      if(err) {
        return cb(err);
      }

      var newFile = new gutil.File({
        cwd: file.cwd,
        base: file.base,
        path: file.path,
        contents: new Buffer(src)
      });

      self.emit('postbundle', src);
      self.push(newFile);
      cb();
    }));
  }
  return through.obj(transform);
};
