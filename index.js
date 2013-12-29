var es = require('event-stream');
var gutil = require('gulp-util');
var browserify = require('browserify');
var path = require('path');



function error(str) {
	gutil.log('gulp-browserify: ', gutil.colors.red(str));
}

module.exports = function(opts) {
  var opts = opts || {};
  var ctrOpts = {};
  var buffer = [];
  var temp = [];
  var bundler, chunk = '';
  var itsABuffer = false;
  var itsAStream = false;

  function bufferContents(file) {
    buffer.push(file);
  }

  function browserifyStream() {
    if (buffer.length === 0) return this.emit('end');

    var self = this;

    buffer.map(function (file) {
        if (gutil.isNull(file.contents)) return cb(null, file); // pass along
        if (gutil.isStream(file.contents)) {
          itsAStream = true;
          ctrOpts.basedir = file.base;
          ctrOpts.entries = file.contents;
        }
        if(gutil.isBuffer(file.contents)) {

          itsABuffer = true;
          ctrOpts.basedir = file.base;
          temp.push(file.contents);
          ctrOpts.entries = es.readArray(temp);
        }else {
          ctrOpts.entries = path.resolve(file.path);
        }

        if(opts.noParse) {
          ctrOpts.noParse = opts.noParse.map(function(filepath) {
            return path.resolve(filepath);
          });
          delete opts.noParse;
        }

        bundler = browserify(ctrOpts);
        bundler.on('error', function(err) {
          error(err);
        });

        if(opts.transform) {
          opts.transform.forEach(function(transform) {
            console.log(file.path);
            bundler.transform(transform);
          });
        }

        self.emit('prebundle', bundler);

        var onBundleComplete = function(self, err, src) {
          if(err) {
            error(err);
          }

          var newFile = new gutil.File({
            cwd: file.cwd,
            base: file.base,
            contents: new Buffer(src)
          });

          self.emit('postbundle', src);

          self.emit('data', newFile);
          self.emit('end');
        };

        if(itsAStream || itsABuffer ) {
          var readable = bundler.bundle(opts);
          readable.on('data', function(data) {
            chunk += data;
          }).once('end', function(err) {
            onBundleComplete(self, err, chunk);
          });
        } else {
          bundler.bundle(opts, function(err, src) {
            onBundleComplete(self, err, src);
          });
        }
    });
	}

	return es.through(bufferContents, browserifyStream);
};
