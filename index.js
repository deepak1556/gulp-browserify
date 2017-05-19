var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var browserify = require('browserify');
var copy = require('shallow-copy');
var shim = require('browserify-shim');
var path = require('path');
var util = require('util');
var fs = require('fs');
var Readable = require('stream').Readable || require('readable-stream');

var depCache = {};
var cache = {};

const PLUGIN_NAME = 'gulp-browserify';

function arrayStream(items) {
  var index = 0;
  var readable = new Readable({ objectMode: true });
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

function wrapWithPluginError(originalError){
  var message, opts;

  if ('string' === typeof originalError) {
    message = originalError;
  } else {
    // Use annotated message of ParseError if available.
    // https://github.com/substack/node-syntax-error
    message = originalError.annotated || originalError.message;
    // Copy original properties that PluginError uses.
    opts = {
      name: originalError.name,
      stack: originalError.stack,
      fileName: originalError.fileName,
      lineNumber: originalError.lineNumber
    };
  }

  return new PluginError(PLUGIN_NAME, message, opts);
}

function addDependency(file) {
    depCache[this.path].push(file.id);
    cache[file.id] = file;
}

function isNewer(srcFile, destFile) {
    var f;

    if (!depCache[srcFile]) {
        return true;
    }

    for (f in depCache[srcFile]) {
        try {
            var srcStat = fs.statSync(depCache[srcFile][f]);
            var destStat = fs.statSync(destFile);
            if (srcStat.mtime > destStat.mtime) {
                return true;
            }
        } catch (e) {}
    }
    return false;
}

module.exports = function(opts, data){
  opts = opts || {};
  data = data || {};

  ['noParse', 'extensions', 'resolve'].forEach(function(opt){
    if(opts[opt]) {
      data[opt] = opts[opt];
      delete opts[opt];
    }
  });


  function transform(file, enc, cb){
    var self = this;
    var dest;

    if (opts.dest) {
      dest = path.join(opts.dest, file.relative);
    }

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

    if (!isNewer(file.path, dest)) {
        return cb();
    }

    data.basedir = opts.basedir = path.dirname(file.path);

    depCache[file.path] = [];
    // nobuiltins option
    if (!opts.builtins && opts.nobuiltins) {
      var nob = opts.nobuiltins;
      var builtins = require('./node_modules/browserify/lib/builtins.js');
      nob = 'string' == typeof nob ? nob.split(' ') : nob;

      for (var i = 0; i < nob.length; i++) {
        delete builtins[nob[i]];
      };

      opts.builtins = builtins;
    }

    var bundler = browserify(data, opts);
    bundler.on('dep', addDependency.bind(file));

    if(opts.shim) {
      for(var lib in opts.shim) {
          opts.shim[lib].path = path.resolve(opts.shim[lib].path);
      }
      bundler = shim(bundler, opts.shim);
    }

    bundler.on('error', function(err) {
      self.emit('error', wrapWithPluginError(err));
      cb();
    });

    [
      'exclude',
      'add',
      'external',
      'transform',
      'ignore',
      'require'
    ].forEach( function(method) {
      if (!opts[method]) return;
      [].concat(opts[method]).forEach(function (args) {
        bundler[method].apply(bundler, [].concat(args));
      });
    });

    self.emit('prebundle', bundler);

    // Cache dependency info when building multiple files to speed up bundling
    var bundle = bundler.bundle.bind(bundler);
    bundler.bundle = function (opts_, cb) {
        opts_.cache = cache;
        bundle(opts_, cb);
    };

    var bStream = bundler.bundle(opts, function(err, src){
      if(err) {
        self.emit('error', wrapWithPluginError(err));
      } else {
        self.emit('postbundle', src);

        file.contents = new Buffer(src);
        self.push(file);
      }

      cb();
    });
  }

  return through.obj(transform, function () {
      cache = {};
      this.emit('end');
  });
};
