var gulp = require('gulp');


var download = require("gulp-download");
var unzip = require("gulp-unzip");
var csv2json = require('gulp-csv2json');
var rename = require('gulp-rename');
var del = require('del');
var convertEncoding = require('gulp-convert-encoding');
var fs = require('fs');
var iterateFiles = require("iterate-files"),
    path = require("path");

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
        if(err){
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
        if(err){
            console.log(err);
            cb(err);
        }
        cb();
    }, /.CSV$/)

});

gulp.task('convert2json', function (cb) {
    // Load all javascript files in the test folder or any of their sub folders
    iterateFiles(path.join(process.cwd(), "./tmp"), function (fileName) {
        console.log(fileName);
        return gulp.src(fileName)
            .pipe(csv2json({'group_key': 3, 'pickup': {'postcode': 3, 'state': 7, 'city': 8, 'address': 9}}))
            .pipe(rename({extname: '.json'}))
            .pipe(gulp.dest('./dist/'));
    }, function (err) {
        // run code when all files have been found recursively
        if(err){
            console.log(err);
            cb(err);
        }
        cb();
    }, /.csv$/)
});

gulp.task('clean', function (cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`
    del(['./dist/*', './downloads/*', './tmp/*'], cb);
});

