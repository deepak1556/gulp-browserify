var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var expect = require('chai').expect;

var gulpB = require('../');

function createFakeFile(filename, contents) {
  return new gutil.File({
    cwd: process.cwd(),
    base: path.join(__dirname, 'fixtures'),
    path: path.join(__dirname, 'fixtures', filename),
    contents: contents
  });
}

describe('gulp-browserify', function() {
  var fixtureBuffer = fs.readFileSync('test/fixtures/normal.js');
  var expectedString = fs.readFileSync('test/expected/normal.js', 'utf8');

  it('should return files', function(done) {
    var fakeFile = createFakeFile('normal.js', new Buffer("var test = 'test';"));
    var B = gulpB();
    B.once('data', function(bundled){
      expect(bundled.contents).to.exist;
      done();
    });
    B.end(fakeFile);
  });

  it('should return a buffer', function(done) {
    var fakeFile = createFakeFile('normal.js', new Buffer("var test = 'test';"));
    var B = gulpB();
    B.once('data', function(bundled){
      expect(bundled).to.exist;
      expect(bundled.contents).to.be.an.instanceof(Buffer);
      done();
    });
    B.end(fakeFile);
  });

  it('should return a vinyl file object', function(done) {
    var fakeFile = createFakeFile('normal.js', new Buffer("var test = 'test';"));
    var B = gulpB();
    B.once('data', function(bundled){
      expect(bundled.cwd).to.be.a('string');
      expect(bundled.base).to.be.a('string');
      expect(bundled.path).to.be.a('string');
      done();
    });
    B.end(fakeFile);
  });

  it('should return a browserify require file', function(done) {
    var fakeFile = createFakeFile('normal.js', fixtureBuffer);
    var B = gulpB();
    B.once('data', function(bundled) {
      expect(bundled.contents.toString()).to.equal(expectedString);
      done();
    });
    B.end(fakeFile);
	});

	it('should use the file modified through gulp', function(done) {
    var fakeFile = createFakeFile('normal.js', new Buffer("var test = 'test';"));
    var B = gulpB();
    B.once('data', function(bundled){
      expect(bundled.contents.toString()).to.not.equal("var test = 'test';");
      done();
    });
    B.end(fakeFile);
  });

  it('should shim files', function(done) {
    var fakeFile = new gutil.File({
      cwd: process.cwd(),
      base: path.join(__dirname, 'fixtures'),
      path: path.join(__dirname, "fixtures/shim.js"),
      contents: fs.readFileSync('test/fixtures/shim.js')
    });
    var B = gulpB({shim: {bar: {path: 'test/fixtures/bar.js', exports: 'bar'}}});
    B.once('data', function(bundled){
      expect(bundled.contents.toString()).to.match(/window.bar = \'foobar\'/);
      done();
    });
    B.end(fakeFile);
  });

  it('should emit postbundle event', function(done) {
    var fakeFile = createFakeFile('normal.js', fixtureBuffer);
    var B = gulpB();
    B.once('data', function(bundled) {
      expect(bundled.contents).to.exist;
      done();
    }).on('postbundle', function(data) {
      expect(data.toString()).to.equal(expectedString);
    });
    B.end(fakeFile);
  });

  it('should use extensions', function(done) {
    var fakeFile = new gutil.File({
      cwd: process.cwd(),
      base: path.join(__dirname, 'fixtures'),
      path: path.join(__dirname, "fixtures/extension.js"),
      contents: fs.readFileSync('test/fixtures/extension.js')
    });
    var B = gulpB({ extensions: ['.foo', '.bar'] });
    B.once('data', function(bundled){
      expect(bundled.contents.toString()).to.match(/foo: 'Foo!'/);
      expect(bundled.contents.toString()).to.match(/bar: 'Bar!'/);

      done();
    });
    B.end(fakeFile);
  });

  it('should not parse with noParse', function(done) {
    var fakeFile = new gutil.File({
      cwd: process.cwd(),
      base: path.join(__dirname, 'fixtures'),
      path: path.join(__dirname, 'fixtures/normal.js'),
      contents: fs.readFileSync('test/fixtures/normal.js')
    });
    var B = gulpB({noParse: 'chai'});
    var files = [];
    B.once('data', function(bundled){
      files.push(bundled);
      expect(bundled.contents).to.exist;
      B.once('end', function(){
        expect(files.length).to.equal(1);
        expect(files[0].contents.length).to.equal(581);
      });
      done();
    });
    B.end(fakeFile);
  });

  it('should allow external with buffer', function(done) {
    var fakeFile = new gutil.File({
      cwd: process.cwd(),
      base: path.join(__dirname, 'fixtures'),
      path: path.join(__dirname, 'fixtures/normal.js'),
      contents: fs.readFileSync('test/fixtures/normal.js')
    });
    var B = gulpB();
    var files = [];
    B.once('data', function(bundled){
      files.push(bundled);
      expect(bundled.contents).to.exist;
      B.once('end', function(){
        expect(files.length).to.equal(1);
        expect(files[0].contents.length).to.equal(504);
      });
      done();
    }).on('prebundle', function(bundler) {
      bundler.external('chai');
    });
    B.end(fakeFile);
  });

});