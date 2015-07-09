var gulp = require('gulp');


var download = require("gulp-download");
var unzip = require("gulp-unzip");

var through2 = require('through2');
var rename = require('gulp-rename');
var del = require('del');
var convertEncoding = require('gulp-convert-encoding');

var redis = require("redis");
var sprintf = require('sprintf').sprintf;

var csv = require('fast-csv');
var gutil = require('gulp-util');
var Buffers = require('buffers');

gulp.task('clean', function (callback) {
    del(['./dist/*', './downloads/*', './tmp/*'], callback);
});

gulp.task('download', ['clean'], function (callback) {
    download('http://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip')
        .pipe(gulp.dest("downloads/"))
        .on('end', callback);
});

gulp.task('prepare', ['download'], function (callback) {
    gulp.src('./downloads/*.zip')
        .pipe(unzip())
        .pipe(convertEncoding({from: "cp932", to: "utf8"}))
        .pipe(rename({extname: '.csv'}))
        .pipe(gulp.dest('./tmp/'))
        .on('end', callback);
});

gulp.task('export2redis', ['prepare'],  function (callback) {
    gulp.src('./tmp/*.csv')
        .pipe(through2.obj(function (file, enc, callback) {
            var store = Buffers();

            csv
                .fromStream(file)
                .on("data", function (record) {
                    var line = sprintf(
                        "HMSET jp:zip:%s zipcode %s state %s city %s address %s\n",
                        record[2],
                        record[2],
                        record[6],
                        record[7],
                        record[8]);
                    store.push(new Buffer(line));
                })
                .on("end", function () {
                    file.contents = store.toBuffer();
                    callback(null, file);
                    gutil.log('convert2redis:', gutil.colors.green('✔ ') + file.relative);
                });
        }))
        .pipe(rename({basename: 'aloha', extname: '.txt'}))
        .pipe(gulp.dest('./dist/'))
        .on('end', callback);
});

gulp.task('default', ['export2redis']);
