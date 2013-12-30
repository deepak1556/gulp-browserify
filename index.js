var es = require('event-stream');
var gutil = require('gulp-util');
var browserify = require('browserify');
var path = require('path');


module.exports = function(opts) {
  if(!opts) opts = {};
  var ctrOpts = {};
  var buffer = [];
  var temp = [];
  var bundler = '';

  function bufferContents(file) {
    buffer.push(file);
  }

  function endStream() {
    if (buffer.length === 0) return this.emit('end');
    var self = this;

    buffer.map(function (file) {
      if (gutil.isNull(file.contents)) return cb(null, file); // pass along
      if (gutil.isStream(file.contents)) {
        ctrOpts.entries = file.contents;
      }
      if(gutil.isBuffer(file.contents)) {
        temp.push(file.contents);
        ctrOpts.entries = es.readArray(temp);
      }
      ctrOpts.basedir = file.base;

      bundler = browserify(ctrOpts);
      bundler.on('error', function(){
        throw err;
      });

      if(opts.transform) {
        opts.transform.forEach(bundler.transform);
      }

      self.emit('prebundle', bundler);

      bundler.bundle(opts).pipe(es.wait(function(err, src){
        var newFile = new gutil.File({
          cwd: file.cwd,
          base: file.base,
          contents: new Buffer(src)
        });

        self.emit('postbundle', src);
        self.emit('data', newFile);
        self.emit('end');
      }));
    });
  }
  return es.through(bufferContents, endStream);
};