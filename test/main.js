var gulp = require('gulp');
var gulpB = require('../');
var expect = require('chai').expect;
var es = require('event-stream');
var path = require('path');
var browserify = require('browserify');

describe('gulp-browserify', function() {
	var testFile = path.join(__dirname, './test.js');
	var fileContents;

	beforeEach(function(done) {
		gulp.src(testFile)
			.pipe(gulpB())
			.pipe(es.map(function(file){
				fileContents = file.contents;
				done();
			}))
	})

	it('should return a buffer', function(done) {
		expect(fileContents).to.be.an.instanceof(Buffer);
		done();
	})
	
	it('should bundle modules', function(done) {
		var b = browserify();
		var chunk = '';
		b.add(testFile)
		b.bundle().on('data', function(data) {
			chunk += data;
		}).on('end', function() {
			expect(fileContents.toString()).to.equal(chunk);
			done();
		})
	})
})