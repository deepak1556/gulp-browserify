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

  function browserifyStream(file, cb) {


      if (gutil.isNull(file.contents)) return cb(null, file); // pass along
      if (gutil.isStream(file.contents)) {
        ctrOpts.basedir = file.base;
        ctrOpts.entries = file.contents;
      }
      if(gutil.isBuffer(file.contents)) {

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

      

      var onBundleComplete = function(err, src) {
        if(err) {
          error(err);
        }
        file.contents = new Buffer(src);
        cb(null, file);
      };


      bundler.bundle(opts, function(err, src) {
        onBundleComplete(err, src);
      });
    }
  return es.map(browserifyStream);
};