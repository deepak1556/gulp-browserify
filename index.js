var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var browserify = require('browserify');
var shim = require('browserify-shim');
var path = require('path');
var util = require('util');
var Readable = require('stream').Readable || require('readable-stream');

const PLUGIN_NAME = 'gulp-browserify';

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

    if (file.isStream()) {
      self.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported'));
      return cb();
    }

    // browserify accepts file path or stream.

    if(file.isNull()) {
      data.entries = file.path;
    }

    if(file.isBuffer()) {
      data.entries = arrayStream([file.contents]);
    }

    data.basedir = path.dirname(file.path);

    var bundler = browserify(data);

    if(opts.shim) {
      for(var lib in opts.shim) {
          opts.shim[lib].path = path.resolve(opts.shim[lib].path);
      }
      bundler = shim(bundler, opts.shim);
    }

    bundler.on('error', function(err) {
      self.emit('error', new PluginError(PLUGIN_NAME, err));
      cb();
    });

    ['exclude', 'add', 'external', 'transform', 'ignore', 'require'].forEach( function(method) {
      if (!opts[method]) return;
      if (method == 'require') {
        var args = [].concat(opts[method]);
        if(args.length > 0 && args[0] == 'expose') {
          var exportName = path.basename(file.path, path.extname(file.path));
          bundler[method].apply(bundler, [file.path, {expose: exportName}]);
        } else {
          bundler[method].apply(bundler, [file.path]);
        }
      } else {
        [].concat(opts[method]).forEach(function (args) {
          bundler[method].apply(bundler, [].concat(args));
        })
      }
    })

    self.emit('prebundle', bundler);

    var bStream = bundler.bundle(opts, function(err, src) {
      if(err) {
        self.emit('error', new PluginError(PLUGIN_NAME, err));
      } else {
        self.emit('postbundle', src);

        file.contents = new Buffer(src);
        self.push(file);
      }
      
      cb();
    });
  }
  return through.obj(transform);
};
