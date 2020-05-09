import gulp from 'gulp'
import babel from 'gulp-babel'
import del from 'del'
import connect from 'gulp-connect' // 开发服务
import { createProxyMiddleware } from 'http-proxy-middleware' // 代理
import minifyHtml from 'gulp-minify-html' // 压缩html
import rev from 'gulp-rev'  // 添加hash值
import uglify from 'gulp-uglify' // 压缩
import revCollector from 'gulp-rev-collector'
import less from 'gulp-less'
import imagemin from 'gulp-imagemin'
import base64 from 'gulp-base64'
import eslint from 'gulp-eslint'

/***********************************常量配置**************************************/
const paths = {
  style: {
    src: "src/style/**/*.less",
    dest: 'dest/css',
    dist: 'dist/css/'
  },
  scripts: {
    src: 'src/js/**/*.js',
    dest: 'dest/js/',
    dist: 'dist/js/'
  },
  html: {
    src: 'src/views/**/*.html',
    dest: 'dest/views/',
    dist: 'dist/views/'
  },
  img: {
    src: 'src/image/**/*.{png,jpg,gif,ico}',
    dest: 'dest/image/',
    dist: 'dist/image/'
  },
  rev: {
    src: 'rev/**/*.json',
    jsDest: 'rev/js',
    cssDest: 'rev/css'
  }
};

/***********************************正式环境配置(文件名添加hash值和文件压缩)**************************************/
function cleanDest () {
  return del(['dest'])
}
function cleanRev () {
  return del(['rev'])
}
function images () {
  return gulp.src(paths.img.src, { since: gulp.lastRun(images) })
    .pipe(imagemin())
    .pipe(gulp.dest(paths.img.dest));
}
function style () {
  return gulp.src(paths.style.src)
    .pipe(less())
    .pipe(base64({
      maxImageSize: 10 * 1024
    }))
    .pipe(rev())
    .pipe(gulp.dest(paths.style.dest))
    .pipe(rev.manifest())
    .pipe(gulp.dest(paths.rev.cssDest))
}
function scripts () {
  return gulp.src(paths.scripts.src, { sourcemaps: true })
    .pipe(babel())
    .pipe(rev())
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(rev.manifest())
    .pipe(gulp.dest(paths.rev.jsDest))
}
function html () {
  return gulp.src([paths.rev.src, paths.html.src])
    .pipe(revCollector({
      replaceReved: true,
      dirReplacements: {
        'js': 'js',
        'css': 'css'
      }
    }))
    .pipe(minifyHtml())
    .pipe(gulp.dest(paths.html.dest))
}
const build = gulp.series(cleanDest, gulp.parallel(style, scripts, images), html, cleanRev);

/***********************************开发环境配置**************************************/
function cleanDist () {
  return del(['dist'])
}
function imagesDevelopment () {
  return gulp.src(paths.img.src, { since: gulp.lastRun(imagesDevelopment) })
    .pipe(gulp.dest(paths.img.dist));
}
function styleDevelopment () {
  return gulp.src(paths.style.src)
    .pipe(less())
    .pipe(gulp.dest(paths.style.dist))
}
function scriptsDevelopment () {
  return gulp.src(paths.scripts.src)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(babel())
    .pipe(gulp.dest(paths.scripts.dist))
}
function htmlDevelopment () {
  return gulp.src(paths.html.src)
    .pipe(gulp.dest(paths.html.dist))
}
function reLoad () {
  return gulp.src('dist/**/*.html')
    .pipe(connect.reload())
}
function watch () {
  gulp.watch(paths.html.src, htmlDevelopment)
  gulp.watch(paths.scripts.src, scriptsDevelopment)
  gulp.watch(paths.style.src, styleDevelopment)
  gulp.watch(paths.img.src, imagesDevelopment)
  gulp.watch('dist/**/**.*', reLoad)
}

function server () {
  return connect.server({
    root: 'dist',
    livereload: true,
    middleware: function () {
      return [
        createProxyMiddleware('/api/', {
          target: 'http://*****/',
          changeOrigin: true
        })
      ]
    }
  });
}
const serve = gulp.series(cleanDist, gulp.parallel(styleDevelopment, scriptsDevelopment, imagesDevelopment), htmlDevelopment, gulp.parallel(server, watch));

export default serve
export {
  build,
  serve
}
