/*
 * Gulp Project Boilerplate, Copyright © 2017, Alexander Repeta <axzerk@gmail.com>
 */

const gulp = require('gulp');
const sass = require('gulp-sass');
const babel = require('gulp-babel');
const browserSync = require('browser-sync');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const cssnano = require('gulp-cssnano');
const del = require('del');
const mmq = require('gulp-merge-media-queries');
const autoprefixer = require('gulp-autoprefixer');
const plumber = require('gulp-plumber');
const gulpCached = require('gulp-cached');
const cache = require('gulp-cache');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const rigger = require('gulp-rigger');
const htmlmin = require('gulp-htmlmin');
const cachebust = require('gulp-cache-bust');


// Project paths
const paths = {
  src: {
    html: './src/*.html',
    js: './src/js/**/*.js',
    css: './src/sass/main.scss',
    img: './src/img/**/*.+(png|jpg|gif|svg)',
    fonts: './src/fonts/**/*.*'
  },
  dist: {
    html: './dist',
    js: './dist/js',
    css: './dist/css',
    img: './dist/img',
    fonts: './dist/fonts'
  },
  watch: {
    html: './src/**/*.html',
    css: './src/sass/**/*.scss',
  },
  clean: './dist'
};

// Assembling .html
gulp.task('bundleHtml', () => {
  return gulp.src(paths.src.html)
    .pipe(gulpCached('html'))
    .pipe(rigger())
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(cachebust({ type: 'timestamp' }))
    .pipe(gulp.dest(paths.dist.html))
    .pipe(browserSync.reload({ stream: true }));
});

// Assembling .scss files
gulp.task('bundleCss', () => {
  return gulp.src(paths.src.css)
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: ':nested' }).on('error', sass.logError))
    .pipe(concat('styles.min.css'))
    .pipe(autoprefixer({
      browsers: ['last 2 versions', '> 1%'],
      cascade: false
    }))
    .pipe(mmq())
    .pipe(cssnano())
    .pipe(sourcemaps.write('.'))
    .pipe(cachebust({ type: 'timestamp' }))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(browserSync.reload({ stream: true }));
});

// Assembling .js files
gulp.task('bundleJs', () => {
  return gulp.src(paths.src.js)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(concat('scripts.min.js'))
    .pipe(babel({ presets: ['env'] }))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.dist.js))
    .pipe(browserSync.reload({ stream: true }));
});

// Optimizing images
gulp.task('bundleImg', () => {
  return gulp.src(paths.src.img)
    .pipe(cache(imagemin([
      imagemin.gifsicle(),
      imagemin.jpegtran(),
      imagemin.optipng()
    ])))
    .pipe(gulp.dest(paths.dist.img))
    .pipe(browserSync.reload({ stream: true }));
});

// Bundling fonts
gulp.task('bundleFonts', () => {
  return gulp.src(paths.src.fonts)
    .pipe(gulp.dest(paths.dist.fonts));
});

// Watching for changes in src files
gulp.task('watch', () => {
  gulp.watch(paths.watch.html, ['bundleHtml']);
  gulp.watch(paths.watch.css, ['bundleCss']);
  gulp.watch(paths.src.js, ['bundleJs']);
  gulp.watch(paths.src.img, ['bundleImg']);
  gulp.watch(paths.src.fonts, ['bundleFonts']);
});

// BrowserSync server
gulp.task('webServer', () => {
  browserSync({
    server: {
      baseDir: './dist'
    },
    host: 'localhost',
    port: 9000,
    logPrefix: 'NASA',
    notify: false
  });
});

// Cleaning dist dir
gulp.task('clean:dist', () => {
  return del.sync(paths.clean);
});

// Cleaning cache
gulp.task('clean:cache', () => {
  return cache.clearAll();
});

// General dist task
gulp.task('dist', ['bundleHtml', 'bundleCss', 'bundleJs', 'bundleFonts', 'bundleImg']);

// Default task to run
gulp.task('start', ['clean:dist', 'clean:cache', 'dist', 'webServer', 'watch']);
