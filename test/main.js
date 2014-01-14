var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var should = require('should');

var gulpB = require('../');

require('mocha');

describe('gulp-browserify', function() {
	
	it('should return files', function(done) {
    var fakeFile = new gutil.File({
      cwd: "test/",
      base: "test/",
      path: "test/fixtures/normal.js",
      contents: new Buffer("var test = 'test';")
    });
    var B = gulpB();
    B.once('data', function(fakeFile){
      should.exist(fakeFile);
      should.exist(fakeFile.contents);
      done();
    });
    B.write(fakeFile);
    B.end(fakeFile);
  });

  it('should return a buffer', function(done) {
    var fakeFile = new gutil.File({
      cwd: "test/",
      base: "test/",
      path: "test/fixtures/normal.js",
      contents: new Buffer("var test = 'test';")
    });
    var B = gulpB();
    B.once('data', function(fakeFile){
      should.exist(fakeFile);
      fakeFile.contents.should.be.an.instanceof(Buffer);
      done();
    });
    B.write(fakeFile);
    B.end(fakeFile);
  });
  
  it('should return a vinyl file object', function(done) {
    var fakeFile = new gutil.File({
      cwd: "test/",
      base: "test/",
      path: "test/fixtures/normal.js",
      contents: new Buffer("var test = 'test';")
    });
    var B = gulpB();
    B.once('data', function(fakeFile){
      fakeFile.cwd.should.be.type('string');
      fakeFile.base.should.be.type('string');
      fakeFile.path.should.be.type('string');
      done();
    });
    B.write(fakeFile);
    B.end(fakeFile);
  });

  it('should return a browserify require file', function(done) {
    var fakeFile = new gutil.File({
      base: 'test/fixtures',
      cwd: 'test/',
      path: 'test/fixtures/normal.js',
      contents: new Buffer(fs.readFileSync('test/fixtures/normal.js', 'utf8'))
    });
    var B = gulpB();
    B.once('data', function(fakeFile) {
      should.exist(fakeFile);
      should.exist(fakeFile.contents);
      String(fakeFile.contents).should.equal(fs.readFileSync('test/expected/normal.js', 'utf8'));
      done();
    });
    B.write(fakeFile);
    B.end(fakeFile);
	});

	it('should use the file modified through gulp', function(done) {
    var fakeFile = new gutil.File({
      cwd: "test/",
      base: "test/",
      path: "test/fixtures/normal.js",
      contents: new Buffer("var test = 'test';")
    });
    var B = gulpB();
    B.once('data', function(fakeFile){
      should.exist(fakeFile);
      should.exist(fakeFile.contents);
      String(fakeFile.contents).should.not.equal("var test = 'test';");
      done();
    });
    B.write(fakeFile);
    B.end(fakeFile);
  });

  it('should shim files', function(done) {
    var fakeFile = new gutil.File({
      cwd: "test/",
      base: "test/",
      path: path.join(__dirname, './shim/shim.js'),
      contents: new Buffer(fs.readFileSync('test/shim/shim.js'))
    });
    var B = gulpB({shim: {bar: {path: 'test/shim/bar.js', exports: 'bar'}}});
    B.once('data', function(fakeFile){
      should.exist(fakeFile);
      should.exist(fakeFile.contents);
      String(fakeFile.contents).should.match(/window.bar = \'foobar\'/);
      done();
    });
    B.write(fakeFile);
    B.end(fakeFile);
	});


});
