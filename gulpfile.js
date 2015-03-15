var gulp = require('gulp');
var browserify = require('browserify');
var source = require ('vinyl-source-stream');

gulp.task('build-front', function() {
  browserify({
    entries: ['./public/js/index.js']
  })
    .bundle()
    .on('error', function() {
      console.log('build fail');
    })
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('watch-front', function() {
  gulp.watch('./public/js/index.js', ['build-front']);
});