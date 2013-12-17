var gulp = require('gulp');
var gulpB = require('../');
var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');
var es = require('event-stream');
var browserify = require('browserify');

describe('gulp-browserify', function() {
	it('should bundle modulees', function(done) {
		var testFile = path.join(__dirname, 'test.js');
		gulp.src(testFile)
			.pipe(gulpB())
			.pipe(es.map(function(file){
				expect(file.contents).to.be.an.instanceof(Buffer);
				done();
			}))
	})
})