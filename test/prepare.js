var fs = require('fs');
var path = require('path');
var browserify = require('browserify');

function fixture(filename, cb, opts) {
  var entry = path.resolve(__dirname, 'fixtures', filename);
  var out = path.resolve(__dirname, 'expected',
                         (typeof opts !== 'undefined' && opts !== null && opts.out ? opts.out : filename));

  var b = browserify({ entries: entry });
  if (opts && opts.ignore) b.ignore(opts.ignore)
  var opts = { detectGlobals: true };
  var s = b.bundle(opts);
  s.on('error', cb);
  s.pipe(fs.createWriteStream(out)).on('finish', cb);
}

// Create bundled files with Browserify for test.
module.exports = function (entries, done) {
  var pendings = entries.length;

  function callback(err) {
    if (err) {
      console.error('Failed to prepare fixture files.');
      console.error(err);
      process.exit(1);
    }

    if (--pendings <= 0) {
      done();
    }
  }

  entries.forEach(function (testobj) {
    if ({}.toString.call(testobj) === '[object Object]') {
      fixture(testobj.file, callback, testobj.opts);
    }
    else {
      fixture(testobj, callback);
    }
  });
};
