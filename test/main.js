var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var coffeeify = require('coffeeify');
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
  it('should return files', function(done) {
    var fakeFile = createFakeFile('normal.js', new Buffer("var test = 'test';"));
    gulpB().once('data', function(bundled){
      expect(bundled.contents).to.exist;
      done();
    }).end(fakeFile);
  });

  it('should return a buffer', function(done) {
    var fakeFile = createFakeFile('normal.js', new Buffer("var test = 'test';"));
    gulpB().once('data', function(bundled){
      expect(bundled.contents).to.be.an.instanceof(Buffer);
      done();
    }).end(fakeFile);
  });

  it('should return a vinyl file object', function(done) {
    var fakeFile = createFakeFile('normal.js', new Buffer("var test = 'test';"));
    gulpB().once('data', function(bundled){
      expect(bundled.cwd).to.be.a('string');
      expect(bundled.base).to.be.a('string');
      expect(bundled.path).to.be.a('string');
      done();
    }).end(fakeFile);
  });

  it('should return a browserify require file', function(done) {
    var fakeFile = createFakeFile('normal.js', fs.readFileSync('test/fixtures/normal.js'));
    gulpB().once('data', function(bundled) {
      expect(bundled.contents.toString()).to.equal(fs.readFileSync('test/expected/normal.js', 'utf8'));
      done();
    }).end(fakeFile);
	});

  it('should return a browserify require file without entry point contents', function(done) {
    var fakeFile = createFakeFile('normal.js', null);
    gulpB().once('data', function(bundled) {
      expect(bundled.contents.toString()).to.equal(fs.readFileSync('test/expected/normal.js', 'utf8'));
      done();
    }).end(fakeFile);
  });

  it('should bundles multiple entry points', function(done) {
    var fakeFile1 = createFakeFile('normal.js', fs.readFileSync('test/fixtures/normal.js'));
    var fakeFile2 = createFakeFile('normal2.js', fs.readFileSync('test/fixtures/normal2.js'));
    var files = {};
    var B = gulpB().on('data', function(bundled) {
      // Order is not guaranteed. Let's keep it with file name.
      files[path.basename(bundled.path)] = bundled;
    }).on('end', function() {
      expect(Object.keys(files).length).to.equal(2);
      expect(files['normal.js'].contents.toString()).to.equal(fs.readFileSync('test/expected/normal.js', 'utf8'));
      expect(files['normal2.js'].contents.toString()).to.equal(fs.readFileSync('test/expected/normal2.js', 'utf8'));
      done();
    });
    B.write(fakeFile1);
    B.end(fakeFile2);
  });

	it('should use the file modified through gulp', function(done) {
    var fakeFile = createFakeFile('normal.js', new Buffer("var test = 'test';"));
    gulpB().once('data', function(bundled){
      expect(bundled.contents.toString()).to.not.equal("var test = 'test';");
      done();
    }).end(fakeFile);
  });

  it('should shim files', function(done) {
    var fakeFile = createFakeFile('shim.js', fs.readFileSync('test/fixtures/shim.js'));
    var opts = {
      shim: {
        bar: {
          path: 'test/fixtures/bar.js',
          exports: 'bar'
        }
      }
    };
    gulpB(opts).once('data', function(bundled){
      expect(bundled.contents.toString()).to.match(/window.bar = \'foobar\'/);
      done();
    }).end(fakeFile);
  });

  it('should emit postbundle event', function(done) {
    var fakeFile = createFakeFile('normal.js', fs.readFileSync('test/fixtures/normal.js'));
    gulpB().once('data', function(bundled) {
      expect(bundled.contents).to.exist;
      done();
    }).on('postbundle', function(data) {
      expect(data.toString()).to.equal(fs.readFileSync('test/expected/normal.js', 'utf8'));
    }).end(fakeFile);
  });

  it('should use extensions', function(done) {
    var fakeFile = createFakeFile('extension.js', fs.readFileSync('test/fixtures/extension.js'));
    var opts = { extensions: ['.foo', '.bar'] };
    gulpB(opts).once('data', function(bundled){
      expect(bundled.contents.toString()).to.match(/foo: 'Foo!'/);
      expect(bundled.contents.toString()).to.match(/bar: 'Bar!'/);
      done();
    }).end(fakeFile);
  });

  it('should not parse with noParse', function(done) {
    var fakeFile = createFakeFile('normal.js', fs.readFileSync('test/fixtures/normal.js'));
    var files = [];
    gulpB({noParse: 'chai'}).on('data', function(bundled){
      files.push(bundled);
      expect(bundled.contents).to.exist;
    }).once('end', function(){
      expect(files.length).to.equal(1);
      expect(files[0].contents.length).to.equal(581);
      done();
    }).end(fakeFile);
  });

  it('should allow external with buffer', function(done) {
    var fakeFile = createFakeFile('normal.js', fs.readFileSync('test/fixtures/normal.js'));
    var files = [];
    gulpB().on('prebundle', function(bundler) {
      bundler.external('chai');
    }).on('data', function(bundled){
      files.push(bundled);
      expect(bundled.contents).to.exist;
    }).once('end', function(){
      expect(files.length).to.equal(1);
      expect(files[0].contents.length).to.equal(504);
      done();
    }).end(fakeFile);
  });

  it('should transform files without entry contents', function(done) {
    // Don't set file contents. Browserify names stream entry as `fake_xxx.js`
    // but coffeify does not work with `.js` files.
    // Without contents, gulp-browserify passes file path to browserify
    // and browserify can reads file from th e given path.
    var fakeFile = createFakeFile('transform.coffee', null);
    var opts = { transform: ['coffeeify'], extensions: ['.coffee'] };
    gulpB(opts).once('data', function (bundled) {
      expect(bundled.contents.toString()).to.match(/foo: 'Foo!'/);
      expect(bundled.contents.toString()).to.match(/bar: 'Bar!'/);
      done();
    }).end(fakeFile);
  });
});
