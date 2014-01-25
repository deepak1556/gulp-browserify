var es = require('event-stream');
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
  var buffer = [];
  var doneCount = 0;

  ['noParse', 'extensions', 'resolve'].forEach(function(opt) {
    if(opts[opt]) {
      data[opt] = opts[opt];
      delete opts[opt];
    }
  });

  function bundleBrowserify() {
    if (buffer.length === 0) return this.emit('end');
    var self = this;

    buffer.forEach(function (file) {
      if (file.isStream()) return new Error('Streams not supported');

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

      bundler.on('error', self.emit.bind(self, 'error'));

      if(opts.transform) opts.transform.forEach(function(transform){
        bundler.transform(transform);
      });

      self.emit('prebundle', bundler);

      var bStream = bundler.bundle(opts);
      bStream.on('error', self.emit.bind(self, 'error'));
      bStream.pipe(es.wait(function(err, src){
        if(err) {
          return self.emit('error', err)
        }

        var newFile = new gutil.File({
          cwd: file.cwd,
          base: file.base,
          path: file.path,
          contents: new Buffer(src)
        });

        self.emit('postbundle', src);
        self.emit('data', newFile);

        if(++doneCount === buffer.length) {
          self.emit('end');
        }
      }));
    });
  }
  return es.through(buffer.push.bind(buffer), bundleBrowserify);
};
