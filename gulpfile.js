var gulp = require('gulp');
var notify = require("gulp-notify");
var plumber = require("gulp-plumber");
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var pug = require('gulp-pug');
var browserSync = require("browser-sync");
var sourcemaps = require('gulp-sourcemaps');
var postcss = require("gulp-postcss");
var cssImport = require("postcss-import");
var stylus  = require('gulp-stylus');
var ftp = require( 'vinyl-ftp' );
var gutil = require( 'gulp-util' );

var browserify = require('browserify');
var source     = require('vinyl-source-stream');

//setting : paths
var paths = {
  'root': './dst/',
  'styl': './src/styl/',
  'css': './dst/assets/css/',
  'pug': './src/pug/',
  'html': './dst/',
  'vue': './src/vue/',
  'js': './dst/assets/js/'
}
var server = {
    'url' : 'hoge.com',
    'host' : 'hoge.com',
    'user' : 'hogehoge',
    'pass' : 'hogehoge',
    'dir' : '/hoge/'
}

//setting : Sass Options
var sassOptions = {
  outputStyle: 'compressed'
}
//setting : Pug Options
var pugOptions = {
  pretty: true
}

var deployFlag = false;

//Sass
gulp.task('styl', function () {
	const plugins = [
		cssImport({
			path: [ 'node_modules' ]
		})
	];
  gulp.src(paths.styl + '**/*.styl')
    .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
    .pipe(sourcemaps.init())
    // .pipe(sass(sassOptions))
    .pipe( stylus({
      compress: true, // cssのmin化
      linenos: false   // line番号の出力
    }) )
		.pipe(sourcemaps.write({includeContent: false}))
		.pipe(sourcemaps.init({loadMaps: true}))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write())
    .pipe(postcss(plugins))
    .pipe(gulp.dest(paths.css))
});

//Pug
gulp.task('pug', () => {
  return gulp.src([paths.pug + '**/*.pug', '!' + paths.pug + '**/_*.pug'])
    .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
    .pipe(pug(pugOptions))
    .pipe(gulp.dest(paths.html));
});

// vue
gulp.task('vue', function () {
  browserify({
    'entries': [paths.vue+'/main.js']
  }) // browserify の設定をして・・・
  .bundle() // 一つのファイルにまとめたものを
  .pipe(source('bundle.js')) // bundle.js という名前のファイルに記録して
  .pipe(gulp.dest(paths.js)) // "./" に書き出します
});

//Deploy
gulp.task('deploy', function(){
  var conn = ftp.create( {
      host:     server.host,
      user:     server.user,
      password: server.pass,
      parallel: 5,
      log:      gutil.log
  } );
  var globs = [
    "dst/**"
  ];
  return gulp.src( globs, { base: './dst', buffer: false } )
        .pipe( conn.dest( server.dir ) );
})

//Browser Sync
gulp.task('browser-sync', () => {
  if(deployFlag) {
  browserSync({
    proxy: {
      target: server.url,
    }
  });
  }else{
    browserSync({
      server: {
        baseDir: paths.root
      }
    });
  }
  gulp.watch(paths.js + "**/*.js", ['reload']);
  gulp.watch(paths.html + "**/*.html", ['reload']);
  gulp.watch(paths.css + "**/*.css", ['reload']);
});
gulp.task('reload', () => {
  browserSync.reload();
});

//watch
gulp.task('watch', function () {
  if(deployFlag) {
    gulp.watch(paths.vue + '**/*.js', ['vue', 'deploy']);
    gulp.watch(paths.styl + '**/*.styl', ['styl', 'deploy']);
    gulp.watch([paths.pug + '**/*.pug', '!' + paths.pug + '**/_*.pug'], ['pug', 'deploy']);
  }else{
    gulp.watch(paths.vue + '**/*.js', ['vue']);
    gulp.watch(paths.styl + '**/*.styl', ['styl']);
    gulp.watch([paths.pug + '**/*.pug', '!' + paths.pug + '**/_*.pug'], ['pug']);
  }
});

gulp.task('default', ['browser-sync', 'pug', 'vue', 'styl', 'watch']);
