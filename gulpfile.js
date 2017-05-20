'use strict';

const gulp = require('gulp');
const del = require('del');
const tsc = require('gulp-typescript');

const tsconfig = require('./tsconfig.json');

// Clean dist folder
gulp.task('clean', () => {
    return del(['dist/**']);
});

// Compile TypeScript files
gulp.task('tsc', [ 'clean' ], () => {
    return gulp
        .src(['./src/**/*.ts'])
        .pipe(tsc.createProject('tsconfig.json')())
        .js.pipe(gulp.dest('./dist'));
});
