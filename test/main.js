var gulp = require('gulp');
var gulpB = require('../');
var expect = require('chai').expect;
var es = require('event-stream');
var path = require('path');
var browserify = require('browserify');

var postdata;

describe('gulp-browserify', function() {
	var testFile = path.join(__dirname, './test.js');
  	var outputFile;

	beforeEach(function(done) {
    vfile = null;
		gulp.src(testFile)
			.pipe(gulpB())
			.on('postbundle', function(data) {
				postdata = data;
			})
			.pipe(es.map(function(file){
				outputFile = file;
				done();
			}))
	})

	it('should return a buffer', function(done) {
		expect(outputFile.contents).to.be.an.instanceof(Buffer);
		done();
	})

  	it('should be a valid vinyl file object', function() {
    	expect(outputFile.cwd).to.be.a('string', 'file.cwd is not a string');
    	expect(outputFile.base).to.be.a('string', 'file.base is not a string');
    	expect(outputFile.path).to.be.a('string', 'file.path is not a string');
  	})

	it('should bundle modules', function(done) {
		var b = browserify();
		var chunk = '';
		b.add(testFile)
		b.bundle().on('data', function(data) {
			chunk += data;
		}).on('end', function() {
			expect(outputFile.contents.toString()).to.equal(chunk);
			done();
		})
	})


	it('should emit postbundle event', function(done) {
		expect(outputFile.contents.toString()).to.equal(postdata);
		done();
	})

	it('should use the gulp version of the file', function(done) {
		gulp.src(testFile)
			.pipe(es.map(function(file, cb) {
				file.contents = new Buffer('var abc=123;');
				cb(null, file);
			}))
			.pipe(gulpB())
			.pipe(es.map(function(file) {
				expect(file.contents.toString()).to.not.equal(outputFile.contents.toString());
				expect(file.contents.toString()).to.match(/var abc=123;/);
				done();
			}))
	})
})

describe('gulp-browserify shim', function() {
	var testFile = path.join(__dirname, './shim/shim.js');
	var shimFile = path.join(__dirname, './shim/bar.js');
  	var outputFile;

	beforeEach(function(done) {
    	vfile = null;
		gulp.src(testFile)
			.pipe(gulpB({
				shim: {
					bar: {
						path: shimFile,
						exports: 'bar'
					}
				}
			}))
			.on('postbundle', function(data) {
				postdata = data;
			})
			.pipe(es.map(function(file){
				outputFile = file;
				done();
			}))
	});

	it('should be able to bundle all defined modules in to one bundle', function(done) {
		expect(outputFile.contents.toString()).to.contain('window.bar = \'foobar\'');
		expect(outputFile.contents.toString()).to.contain('console.log(\'foo\');');
		done();
	});
});

describe('gulp-browserify non stream error', function () {
	var testFile = path.join(__dirname, './error/index.js');

	it('emits error if browserify calls callback with error', function (done) {
		gulp.src(testFile, { read: false })
			.pipe(gulpB())
			.on('error', function () { done(); })
			.on('postbundle', function () { throw new Error('No error was emitted.') });
	});
});			

describe('gulp-browserify extensions', function () {
	var testFile = path.join(__dirname, './extensions/index.js');
	var postData, outputFile;
	beforeEach(function (done) {
		gulp.src(testFile)
			.pipe(gulpB({ extensions: ['.foo', '.bar'] }))
			.on('postbundle', function(data) {
				postdata = data;
			})
			.pipe(es.map(function(file){
				outputFile = file;
				done();
			}));
	});
	
	it('should find dependencies with given extension', function () {
		expect(outputFile.contents.toString()).to.contain("foo: 'Foo!'");
		expect(outputFile.contents.toString()).to.contain("bar: 'Bar!'");
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
