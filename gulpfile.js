// Consts
const siteRoot = '_site';
const cssFiles = '_scss/**/*.scss';
const jsFile = '_js/main.js';
const manifestFiles = '_images/**/*.{json,xml}';
const imagesFiles = '_images/**/*.{png,ico}';

// package.json
const packageJson = require('./package.json');

// Gulp
const gulp = require('gulp');
const gutil = require('gulp-util');
const child = require('child_process');
const browserSync = require('browser-sync').create();

// CSS
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');

// JS
const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');

const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const merge = require('utils-merge');

const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');

// Images
const imagemin = require('gulp-imagemin');


// CSS related tasks:

function bundle_css(args) {
  args = typeof args === 'undefined' ? {} : args;

  return gulp.src(cssFiles)
    .pipe(sass({
      includePaths: [
        './node_modules/typewriter-js'
    ]}))
    .pipe(autoprefixer({
      browsers: ['> 1%'],
      cascade: false
    }))
    .pipe(gulp.dest('assets/css'))
    //.pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(rename('all.min.css'))
    .pipe(cssnano())
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('assets/css'));
}

gulp.task('css', () => {
  return bundle_css();
});


// JS related tasks

function bundle_js(bundler) {
  return bundler.bundle()
    .pipe(source('all.js'))
    .pipe(buffer())
    .pipe(gulp.dest('assets/js'))
    //.pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(rename('all.min.js'))
    .pipe(uglify())
    //.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('assets/js'));
}

function create_bundler(args) {
  args = typeof args === 'undefined' ? {} : args;

  return browserify(jsFile, args).transform(babelify, {
    presets: ['es2015']
  });
}

gulp.task('browserify', () => {
  return bundle_js(create_bundler());
});


// Images

gulp.task('copy-manifests', () => {
  return gulp.src(manifestFiles)
    .pipe(gulp.dest('assets/images'));
});

gulp.task('images', ['copy-manifests'], () => {
  return gulp.src(imagesFiles)
    .pipe(imagemin())
    .pipe(gulp.dest('assets/images'));
});


// Jekyll related tasks

function bundle_jekyll(args) {
  args = typeof args === 'undefined' ? {} : args;

  const options = [
    'build',
    '--incremental',
    '--drafts'
  ];

  if (args.debug === true) {
    options.push('--watch');
  }

  const jekyll = child.spawn('jekyll', options);

  const jekyllLogger = (buffer) => {
    buffer.toString()
      .split(/\n/)
      .forEach((message) => gutil.log('Jekyll: ' + message));
  };

  jekyll.stdout.on('data', jekyllLogger);
  jekyll.stderr.on('data', jekyllLogger);

  return jekyll;
}

gulp.task('jekyll', () => { bundle_jekyll({ debug: true }); });
gulp.task('jekyll-build', () => { bundle_jekyll(); });

gulp.task('serve', () => {
  browserSync.init({
    files: [siteRoot + '/**'],
    port: 4000,
    server: {
      baseDir: siteRoot
    }
  });

  gulp.watch(cssFiles, ['css']);
  gulp.watch(manifestFiles, ['copy-manifests']);
  gulp.watch(imagesFiles, ['images']);

  const args = merge(watchify.args, { debug: true });
  const bundler = watchify(create_bundler(args));

  bundle_js(bundler);
  bundler.on('update', () => bundle_js(bundler));
});

gulp.task('assets', ['images', 'css', 'browserify']);
gulp.task('build', ['assets', 'jekyll-build']);
gulp.task('default', ['assets', 'jekyll', 'serve']);
