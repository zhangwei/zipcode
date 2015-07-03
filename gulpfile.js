var gulp = require('gulp');


var download = require("gulp-download");
var unzip = require("gulp-unzip");
var csv2json = require('gulp-csv2json');
var rename = require('gulp-rename');
var del = require('del');
var convertEncoding = require('gulp-convert-encoding');
var fs = require('fs');

// Rerun the task download ken_all.zip
gulp.task('download', function () {
    var rows = fs.readFileSync('download_urls.txt').toString().split("\n");
    for (var i in rows) {
        //download('http://www.post.japanpost.jp/zipcode/dl/kogaki/zip/13tokyo.zip')
        if (rows.hasOwnProperty(i)) {
            download(rows[i])
                .pipe(gulp.dest("downloads/"));
        }
    }
});

// Rerun the task unzip ken_all.zip
gulp.task('unzip', function () {
    gulp.src("./downloads/*.zip")
        .pipe(unzip())
        .pipe(gulp.dest('./downloads/'));
});

// Rerun the task unzip ken_all.zip
gulp.task('convert_encoding', function () {
    return gulp.src('./downloads/*.CSV')
        .pipe(convertEncoding({from: 'cp932', to: 'utf8'}))
        .on('error', function (err) {
            console.log(err);
        })
        .pipe(rename({extname: '.csv'}))
        .pipe(gulp.dest('./tmp/'));
});

gulp.task('convert2json', function () {
    gulp.src('./tmp/*.csv')
        .pipe(csv2json({'group_key': 3, 'pickup': {'postcode': 3, 'state': 7, 'city': 8, 'address': 9}}))
        .on('error', function (err) {
            console.log(err);
        })
        .pipe(rename({extname: '.json'}))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('clean', function (cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`
    del(['./dist/*', './downloads/*', './tmp/*'], cb);
});

