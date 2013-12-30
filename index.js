var es = require('event-stream');
var gutil = require('gulp-util');
var browserify = require('browserify');
var path = require('path');


module.exports = function(opts) {
  var opts = opts || {};
  var ctrOpts = {};
  var buffer = [];
  var temp = [];
  var bundler, chunk = '';

  function bufferContents(file) {
    buffer.push(file);
  }
  function endStream(cb) {
    if (buffer.length === 0) return this.emit('end');
    var self = this;

    buffer.map(function (file) {
      if (gutil.isNull(file.contents)) return cb(null, file); // pass along
      if (gutil.isStream(file.contents)) {
        ctrOpts.basedir = file.base;
        ctrOpts.entries = file.contents;
      }
      if(gutil.isBuffer(file.contents)) {

        ctrOpts.basedir = file.base;
        temp.push(file.contents);
        ctrOpts.entries = es.readArray(temp);
      }

      bundler = browserify(ctrOpts);
      bundler.on('error', cb);

      if(opts.transform) {
        opts.transform.forEach(bundler.transform);
      }

      self.emit('prebundle', bundler);

      var onBundleComplete = function( self, err, src) {
        if(err) return err;

        var newFile = new gutil.File({
          cwd: file.cwd,
          base: file.base,
          contents: new Buffer(src)
        });

        self.emit('postbundle', src);

        self.emit('data', newFile);
        self.emit('end');
      };

      var readable = bundler.bundle(opts);
        readable.on('data', function(data) {
          chunk += data;
        }).once('end', function(err) {
          onBundleComplete(self, err, chunk);
      });



    });
  }
  return es.through(bufferContents, endStream);
};