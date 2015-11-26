var gulp = require('gulp');
var gutil = require('gulp-util');

gulp.task('clean', function (callback) {
    var del = require('del');
    del(['./dist/*', './downloads/*', './tmp/*'], callback);
});

gulp.task('download', ['clean'], function (callback) {
    var rename = require('gulp-rename');
    var download = require("gulp-download");
    //download('http://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip')
    //download('http://zipcloud.ibsnet.co.jp/zipcodedata/download?di=1446192625445')
    download('http://zipcloud.ibsnet.co.jp/zipcodedata/download?di=1446192640436') //加工済み
        .pipe(rename({basename: 'ken_all', extname: '.zip'}))
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
        .pipe(gulp.dest('./downloads/'))
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

    gulp.src('./downloads/*.csv')
        .pipe(through2.obj(function (chunk, enc, callback) {
            var rstream = fs.createReadStream(chunk.path);
            var wstream = null;
            var store = null;
            var files = {};
            var count = 0;

            csv
                .fromStream(rstream, {ignoreEmpty: true})
                .on("data", function (record) {
                    var line = sprintf(
                        '"%s":["%s","%s","%s"],\n',
                        //record[2],
                        record[2],
                        record[6],
                        record[7],
                        record[8]);

                    //gutil.log('csv2json:', gutil.colors.green('✔ ') + record[2]);
                    count++;
                    start3 = record[2].slice(0, 3);
                    if (files.hasOwnProperty(start3)) {
                        store = files[start3];
                    } else {
                        store = new Buffers();
                        files[start3] = store;
                    }
                    store.push(new Buffer(line));
                })
                .on("end", function () {
                    for (var bufs in files) {
                        if (files.hasOwnProperty(bufs)) {
                            wstream = fs.createWriteStream('./tmp/' + bufs + ".json");
                            var contents = files[bufs].toBuffer();

                            wstream.write(
                                Buffer.concat([
                                    new Buffer('{\n', 'utf8'),
                                    contents.slice(0, contents.length - 2),
                                    new Buffer('\n}', 'utf8')
                                ]));
                            wstream.end();
                        }
                    }

                    gutil.log('csv2json:', gutil.colors.green('✔ ') + 'count: ' + count);
                    callback(null, chunk);
                });
        }));

    gulp.src('./tmp/*.json')
        .pipe(replace("以下に掲載がない場合", ""))
        .pipe(gulp.dest('./dist/'))
        .on('end', function (callback) {
            var del = require('del');
            del(['./tmp/*'], callback);
        });
});

gulp.task('default', ['prepare', 'csv2json']);
