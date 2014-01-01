var fs = require('fs');
var path = require('path');

var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var should = require('should');
var es = require('event-stream');
var browserify = require('browserify');

var gulpB = require('../');

var postdata;

describe('gulp-browserify', function() {
	var testFile = path.join(__dirname, './test.js');
	var expectedOutput = fs.readFileSync(path.join(__dirname,'./fixtures/expected.js'), 'utf8');
	var fileContents;

	beforeEach(function(done) {
		gulp.src(testFile)
			.pipe(gulpB())
			.on('postbundle', function(data) {
				postdata = data;
			})
			.pipe(es.map(function(file){
				fileContents = file.contents;
				done();
			}));
	});

	it('should return a buffer', function(done) {
		(fileContents).should.be.an.instanceof(Buffer);
		done();
	});
	
	it('should bundle modules', function(done) {
		var b = browserify();
		var chunk = '';
		b.add(testFile);
		b.bundle().on('data', function(data) {
			chunk += data;
		}).on('end', function() {
			String(fileContents.toString()).should.equal(chunk);
			done();
		});
	});


	it('should emit postbundle event', function(done) {
		String(fileContents.toString()).should.equal(postdata);
		done();
	});

	it('should pass a buffer through', function(done) {
		gulp.src(testFile)
			.pipe(es.map(function(file, cb) {
				file.contents = new Buffer('var abc=123;');
				cb(null, file);
			}))
			.pipe(gulpB())
			.pipe(es.map(function(file) {
				String(file.contents.toString()).should.not.equal(fileContents.toString());
				String(file.contents.toString()).should.match(/var abc=123;/);
				done();
			}));
	});


});
