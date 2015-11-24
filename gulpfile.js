var gulp = require('gulp');
var gutil = require('gulp-util');

gulp.task('clean', function (callback) {
    var del = require('del');
    del(['./dist/*', './downloads/*', './tmp/*'], callback);
});

gulp.task('download', ['clean'], function (callback) {
    var download = require("gulp-download");
    download('http://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip')
        .pipe(gulp.dest("downloads/"))
        .on('end', callback);
});

gulp.task('prepare', function (callback) {
    var unzip = require("gulp-unzip");
    var convertEncoding = require('gulp-convert-encoding');
    var rename = require('gulp-rename');
    gulp.src('./downloads/*.zip')
        .pipe(unzip())
        .pipe(convertEncoding({from: "cp932", to: "utf8"}))
        .pipe(rename({extname: '.csv'}))
        .pipe(gulp.dest('./tmp/'))
        .on('end', callback);
});

gulp.task('csv2json', ['prepare'], function (callback) {
    var through2 = require('through2');
    var replace = require('gulp-replace');
    var rename = require('gulp-rename');
    var fs = require('fs');
    var csv = require('fast-csv');
    var Buffers = require('buffers');
    var sprintf = require('sprintf').sprintf;

    gulp.src('./tmp/*.csv')
        .pipe(through2.obj(function (chunk, enc, callback) {
            var stream = fs.createReadStream(chunk.path);
            var store = Buffers();

            csv
                .fromStream(stream)
                .on("data", function (record) {
                    var line = sprintf(
                        '"%s":["%s","%s","%s"],\n',
                        //record[2],
                        record[2],
                        record[6],
                        record[7],
                        record[8]);

                    store.push(new Buffer(line));
                })
                .on("end", function () {
                    chunk.contents = store.toBuffer();
                    chunk.contents = Buffer.concat([
                        new Buffer('{', 'utf8'),
                        chunk.contents.slice(0, chunk.contents.length - 2),
                        new Buffer('}', 'utf8')
                    ]);
                    callback(null, chunk);
                    gutil.log('csv2json:', gutil.colors.green('✔ ') + chunk.relative);
                });
        }))
        .pipe(replace("以下に掲載がない場合", ""))
        .pipe(rename({basename: 'all', extname: '.json'}))
        .pipe(gulp.dest('./dist/'))
        .on('end', callback);
});

gulp.task('default', ['prepare', 'csv2json']);
