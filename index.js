var es = require('event-stream');
var gutil = require('gulp-util');
var browserify = require('browserify');


module.exports = function(opts) {
  if(!opts) opts = {};
  var data = {};
  var buffer = [];
  var temp = [];
  var bundler = '';


  function bundleBrowserify() {
    if (buffer.length === 0) return this.emit('end');
    var self = this;

    buffer.map(function (file) {
      if (file.isNull) return cb(null, file); // pass along
      if (file.isStream) return cb(new Error('Streams not supported'));

      temp.push(file.contents);
      data.entries = es.readArray(temp);
      data.basedir = file.base;

      bundler = browserify(data);
      bundler.on('error', self.emit.bind(this, 'error'));

      if(opts.transform) opts.transform.forEach(bundler.transform);

      self.emit('prebundle', bundler);
      
      var bStream = bundler.bundle(opts);
      bStream.pipe(es.wait(function(err, src){
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
  return es.through(buffer.push.bind(buffer), bundleBrowserify);
};