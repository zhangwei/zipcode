var gulp = require('gulp');


var download = require("gulp-download");
var unzip = require("gulp-unzip");

var through2 = require('through2');
var rename = require('gulp-rename');
var del = require('del');
var convertEncoding = require('gulp-convert-encoding');

var iterateFiles = require("iterate-files"),
    path = require("path");
var redis = require("redis");
var sprintf = require('sprintf').sprintf;
var tempWrite = require('temp-write');
var csv = require('fast-csv');
var fs = require('fs');
var gutil = require('gulp-util');
var Buffers = require('buffers');

// Rerun the task download ken_all.zip
gulp.task('download', function (cb) {
    var rows = fs.readFileSync('download_urls.txt').toString().split("\n");
    for (var i in rows) {
        //download('http://www.post.japanpost.jp/zipcode/dl/kogaki/zip/13tokyo.zip')
        if (rows.hasOwnProperty(i)) {
            download(rows[i])
                .pipe(gulp.dest("downloads/"));
        }
    }
    cb();
});

// Rerun the task unzip ken_all.zip
gulp.task('unzip', function (cb) {
    // Load all javascript files in the test folder or any of their sub folders
    iterateFiles(path.join(process.cwd(), "./downloads"), function (fileName) {
        console.log(fileName);
        return gulp.src(fileName)
            .pipe(unzip())
            .pipe(gulp.dest('./downloads/'));
    }, function (err) {
        // run code when all files have been found recursively
        if (err) {
            console.log(err);
            cb(err);
        }
        cb();
    }, /.zip$/)
});

// Rerun the task unzip ken_all.zip
gulp.task('convert_encoding', function (cb) {
    // Load all javascript files in the test folder or any of their sub folders
    iterateFiles(path.join(process.cwd(), "./downloads"), function (fileName) {
        console.log(fileName);
        return gulp.src(fileName)
            .pipe(convertEncoding({from: "cp932", to: "utf8"}))
            .pipe(rename({extname: '.csv'}))
            .pipe(gulp.dest('./tmp/'));
    }, function (err) {
        // run code when all files have been found recursively
        if (err) {
            console.log(err);
            cb(err);
        }
        cb();
    }, /.CSV$/)

});

gulp.task('convert2redis_command', function (cb) {
    return gulp.src('./tmp/*.csv')
        .pipe(through2.obj(function (file, enc, callback) {
            var store = Buffers();

            csv
                .fromStream(file)
                .on("data", function (record) {
                    var line = sprintf(
                        "HMSET jpzip::%s state %s city %s address %s\n",
                        record[2],
                        record[6],
                        record[7],
                        record[8]);
                    store.push(new Buffer(line));
                })
                .on("end", function () {
                    file.contents = store.toBuffer();
                    callback(null, file);
                    gutil.log('gulp-csv2json:', gutil.colors.green('✔ ') + file.relative);
                });


        }))
        .pipe(rename({basename: 'aloha', extname: '.txt'}))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('clean', function (cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`
    del(['./dist/*', './downloads/*', './tmp/*'], cb);
});
