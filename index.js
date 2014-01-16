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
  var bundler = '';


  function bundleBrowserify() {
    if (buffer.length === 0) return this.emit('end');
    var self = this;

    buffer.forEach(function (file) {
      if (file.isNull()) return null, file; // pass along
      if (file.isStream()) return new Error('Streams not supported');

      data.entries = new ArrayStream([file.contents]);
      data.basedir = file.base;

      if(opts.noParse) {
          data.noParse = opts.noParse;
          delete opts.noParse;
      }

      if(opts.extensions) {
          data.extensions = opts.extensions;
          delete opts.extensions;
      }

      if(opts.transform) opts.transform.forEach(function(transform){
        bundler.transform(transform);
      });
        
      if(opts.shim) {
        for(var lib in opts.shim) {
            opts.shim[lib].path = path.resolve(opts.shim[lib].path);
        }
        bundler = shim(browserify(), opts.shim);
        bundler.require(file.path, { entry: true });
      }
      else{
        bundler = browserify(data);
        bundler.on('error', self.emit.bind(this, 'error'));
      }

      self.emit('prebundle', bundler);
      
      var bStream = bundler.bundle(opts);
      bStream.pipe(es.wait(function(err, src){
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
