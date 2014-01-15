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
      path: path.join(__dirname, './fixtures/shim.js'),
      contents: new Buffer(fs.readFileSync('test/fixtures/shim.js'))
    });
    var B = gulpB({shim: {bar: {path: 'test/fixtures/bar.js', exports: 'bar'}}});
    B.once('data', function(fakeFile){
      should.exist(fakeFile);
      should.exist(fakeFile.contents);
      String(fakeFile.contents).should.match(/window.bar = \'foobar\'/);
      done();
    });
    B.write(fakeFile);
    B.end(fakeFile);
  });

  it('should emit postbundle event', function(done) {
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
      done();
    }).on('postbundle', function(data) {
      String(data).should.equal(fs.readFileSync('test/expected/normal.js', 'utf8'));    
    });
    B.write(fakeFile);
    B.end(fakeFile);
  });  

  it('should use extensions', function(done) {
    var fakeFile = new gutil.File({
      cwd: "test/fixtures/",
      base: "test/fixtures/",
      path: path.join(__dirname, './fixtures/extension.js'),
      contents: new Buffer(fs.readFileSync('test/fixtures/extension.js'))
    });
    var B = gulpB({ extensions: ['.foo', '.bar'] });
    B.once('data', function(fakeFile){
      should.exist(fakeFile);
      should.exist(fakeFile.contents);
      String(fakeFile.contents).should.match(/foo: 'Foo!'/);
      String(fakeFile.contents).should.match(/bar: 'Bar!'/);
      
      done();
    });
    B.write(fakeFile);
    B.end(fakeFile);
  });

  it('should not parse with noParse', function(done) {
    var fakeFile = new gutil.File({
      cwd: "test/fixtures/",
      base: "test/fixtures/",
      path: path.join(__dirname, './fixtures/normal.js'),
      contents: new Buffer(fs.readFileSync('test/fixtures/normal.js'))
    });
    var B = gulpB({noParse: 'should'});
    var files = [];
    B.once('data', function(fakeFile){
      files.push(fakeFile);
      should.exist(fakeFile);
      should.exist(fakeFile.contents);
    B.once('end', function(){
      files.length.should.equal(1);
      files[0].contents.length.should.equal(568);
    });
      done();
    });
    B.write(fakeFile);
    B.end(fakeFile);
  });

});

describe('gulp-browserify external with buffer', function () {
	it('should not bundle external module', function (done) {
		var testFile = path.join(__dirname, './test.js');
		var files = [];
		gulp.src(testFile) // `gulp.src` defaults to buffer contents.
			.pipe(gulpB())
			.on('prebundle', function (bundler) {
				bundler.external('gulp');
			})
			.on('data', function (file) {
				files.push(file);
			})
			.on('end', function () {
				expect(files.length).to.eq(1);
				expect(files[0].contents.length).to.be.lessThan(1000);
				done();
			});
	});
});

describe('gulp-browserify multiple entry points', function () {
	it('should emits multiple bundled scripts', function (done) {
		var testFile = path.join(__dirname, './test.js');
		var anotherFile = path.join(__dirname, './another.js');
		var files = [];
		gulp.src([testFile, anotherFile])
			.pipe(gulpB())
			.on('data', function (file) {
				files.push(file);
			})
			.on('end', function () {
				expect(files.length).to.eq(2);
				expect(files[0].contents.length).to.eq(725186);
				expect(files[1].contents.length).to.eq(725186);
				done();
			});
	});
});

describe('gulp-browserify noParse', function () {
	it('should not parse or browserify noParse module', function (done) {
		var testFile = path.join(__dirname, './test.js');
		var files = [];
		gulp.src(testFile)
			.pipe(gulpB({ noParse: 'gulp' }))
			.on('data', function (file) {
				files.push(file);
			})
			.on('end', function () {
				expect(files.length).to.eq(1);
				expect(files[0].contents.length).to.eq(2089);
				done();
			});
	});
});
