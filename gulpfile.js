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
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const rigger = require('gulp-rigger');
const htmlmin = require('gulp-htmlmin');
const notify = require('gulp-notify');
const importFile = require('gulp-file-include');
const rename = require('gulp-rename');
const critical = require('critical').stream;
const cache = require('gulp-cache');
const cached = require('gulp-cached');
const cachebust = require('gulp-cache-bust');
const swPrecache   = require('sw-precache');

/*
 * Project paths
 */
const paths = {
  src: {
    html: './src/*.html',
    js: './src/js/common.js',
    scss: './src/scss/styles.scss',
    img: './src/img/**/*',
    fonts: './src/fonts/**/*',
    manifest: './src/manifest.json'
  },
  dist: {
    html: './dist',
    js: './dist/scripts',
    css: './dist/styles',
    img: './dist/images',
    fonts: './dist/fonts',
    manifest: './dist'
  },
  watch: {
    html: './src/**/*.html',
    scss: './src/scss/**/*.scss',
    js: './src/js/**/*.js'
  },
  clean: './dist'
};

/*
 * Assembling .scss files
 */
gulp.task('DEV:bundleSCSS', () => {
  return gulp
    .src(paths.src.scss)
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: ':nested' }))
    .on(
      'error',
      notify.onError({
        title: 'SCSS',
        message: '<%= error.message %>'
      })
    )
    .pipe(
      autoprefixer({
        browsers: ['last 15 versions', '> 1%'],
        cascade: false
      })
    )
    .pipe(mmq())
    .pipe(cssnano())
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dist.css))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('PROD:bundleSCSS', () => {
  return gulp
    .src(paths.src.scss)
    .pipe(sass())
    .pipe(
      autoprefixer({
        browsers: ['last 15 versions', '> 1%'],
        cascade: false
      })
    )
    .pipe(mmq())
    .pipe(cssnano())
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(cachebust({ type: 'timestamp' }))
    .pipe(gulp.dest(paths.dist.css));
});

/*
 * Assembling .html files
 */
gulp.task('DEV:bundleHTML', () => {
  return gulp
    .src(paths.src.html)
    .pipe(cached('html'))
    .pipe(rigger())
    .on(
      'error',
      notify.onError({
        title: 'HTML',
        message: '<%= error.message %>'
      })
    )
    .pipe(gulp.dest(paths.dist.html))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('PROD:bundleHTML', () => {
  return gulp
    .src(paths.src.html)
    .pipe(rigger())
    .pipe(
      critical({
        base: './dist/',
        minify: true,
        inline: true,
        width: 1920,
        height: 1280,
        css: [`${paths.dist.css}/styles.min.css`]
      })
    )
    .on(
      'error',
      notify.onError({
        title: 'HTML',
        message: '<%= error.message %>'
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(cachebust({ type: 'timestamp' }))
    .pipe(gulp.dest(paths.dist.html));
});

/*
 * Assembling .js files
 */
gulp.task('DEV:bundleJS', () => {
  return gulp
    .src(paths.src.js)
    .pipe(
      plumber({
        errorHandler: notify.onError({
          title: 'JS',
          message: '<%= error.message %>'
        })
      })
    )
    .pipe(
      importFile({
        prefix: '@@',
        basepath: '@file'
      })
    )
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.dist.js))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('PROD:bundleJS', () => {
  return gulp
    .src(paths.src.js)
    .pipe(
      importFile({
        prefix: '@@',
        basepath: '@file'
      })
    )
    .pipe(babel())
    .pipe(uglify())
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(gulp.dest(paths.dist.js));
});

/*
 * Creating a Service Worker
 */
gulp.task('serviceWorker', () => {
  swPrecache.write(`./dist/service-worker.js`, {
    staticFileGlobs: [
      './dist/manifest.json',
      './dist/**/*.html',
      './dist/styles/*.min.css',
      './dist/fonts/**/*',
      './dist/images/**/*',
      './dist/scripts/*.min.js'
    ],
    stripPrefix: `./src`
  });
});

/*
 * Optimizing and caching images
 */
gulp.task('bundleIMG', () => {
  return gulp
    .src(paths.src.img)
    .pipe(
      cache(
        imagemin([imagemin.gifsicle(), imagemin.jpegtran(), imagemin.optipng()])
      )
    )
    .pipe(gulp.dest(paths.dist.img));
});

/*
 * Assembling fonts
 */
gulp.task('bundleFonts', () => {
  return gulp.src(paths.src.fonts).pipe(gulp.dest(paths.dist.fonts));
});

/*
 * Assembling manifest
 */
gulp.task('PROD:bundleManifest', () => {
  return gulp.src(paths.src.manifest).pipe(gulp.dest(paths.dist.manifest));
});

/*
 * Watching for file changes in ./src
 */
gulp.task('DEV:watch', () => {
  gulp.watch(paths.watch.html, ['DEV:bundleHTML']);
  gulp.watch(paths.watch.scss, ['DEV:bundleSCSS']);
  gulp.watch(paths.watch.js, ['DEV:bundleJS']);
  gulp.watch(paths.src.img, ['bundleIMG']);
  gulp.watch(paths.src.fonts, ['bundleFonts']);
});

/*
 * BrowserSync dev web-server
 */
gulp.task('DEV:webServer', () => {
  browserSync({
    server: {
      baseDir: './dist'
    },
    host: 'localhost',
    port: 3000,
    logPrefix: 'DevServer',
    notify: false
  });
});

/*
 * Cleaning ./dist dir
 */
gulp.task('clean:dist', () => {
  return del.sync(paths.clean);
});

/*
 * Cleaning cache
 */
gulp.task('clean:cache', () => {
  return cache.clearAll();
});

/*
 * Removing repository specific files
 */
gulp.task('prepare', () => {
  return del.sync(['**/.gitkeep', 'README.md']);
});

/*
 * Building for development
 */
gulp.task('DEV:build', [
  'clean:dist',
  'clean:cache',
  'DEV:bundleSCSS',
  'bundleFonts',
  'bundleIMG',
  'DEV:bundleHTML',
  'DEV:bundleJS',
  'DEV:webServer',
  'DEV:watch'
]);

/*
 * Building for production
 */
gulp.task('PROD:build', [
  'bundleIMG',
  'bundleFonts',
  'PROD:bundleManifest',
  'PROD:bundleSCSS',
  'PROD:bundleHTML',
  'PROD:bundleJS',
  'serviceWorker'
]);
