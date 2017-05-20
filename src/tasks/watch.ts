import * as colors from 'colors';
import * as path from 'path';
const LiveReload = require('sp-live-reload');
import * as watch from 'gulp-watch';

import Build from '../utils/build';
import { getBuildInstance } from './build';

import { Gulp } from '@types/gulp';
import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const watchTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

    const Watcher = function(configs: IGulpConfigs) {
        // console.log(`\n${colors.yellow('===')} ${colors.green('Watcher is watching')} ${colors.yellow('===')}\n`);

        watch('./src/masterpage/' + configs.appConfig.masterpageCodeName + '.hbs', () => {
            gulp.start('build:masterpage');
        });
        watch('./src/masterpage/layouts/*.hbs', () => {
            gulp.start('build:layouts');
        });
        watch('./src/styles/frankfurt/**/*.scss', () => {
            gulp.start('build:css-custom');
        });
        watch('./src/scripts/frankfurt/**/*.ts', () => {
            gulp.start('build:webpack');
        });
        watch('./src/webparts/**/*.hbs', (vinyl) => {
            const build = getBuildInstance(configs);

            let packageData = require(path.join(process.cwd(), 'package.json'));
            let data = {
                publishPath: configs.privateConf.siteUrl + '/' + configs.appConfig.spFolder,
                masterpageName: configs.appConfig.masterpageCodeName,
                spRootFolder: configs.appConfig.spFolder,
                assetsVersion: packageData.version + '_' + (new Date()).getTime(),
                ...(configs.appConfig.masterpage || {})
            };
            let targetFolder = configs.appConfig.distFolder + '/webparts';

            let srcPath = path.relative('./src', vinyl.path);
            let relPath = path.relative(path.join('./src', 'webparts'), vinyl.path);
            let fileParse = path.parse(relPath);
            let trgPath = path.join(targetFolder, path.dirname(relPath), fileParse.name + '.html');

            build.compileHbsTemplate({
                source: srcPath,
                target: trgPath,
                data: data
            })
                .then((res) => {
                    console.log('Webpart is compiled', trgPath);
                })
                .catch((err) => {
                    console.log('Error', err);
                });
        });
    };

    gulp.task('watch', [ 'config' ], () => {
        console.log(`\n${colors.yellow('===')} ${colors.green('Watch Assets')} ${colors.yellow('===')}\n`);

        let configs: IGulpConfigs = global.gulpConfigs;

        watch(configs.watch.assets, function (event) {
            console.log(event.path);
            gulp
                .src(event.path, {
                    base: configs.watch.base
                })
                .pipe(
                    $.spsave(
                        configs.spSaveCoreOptions,
                        configs.privateConf.creds
                    )
                );
        });
        // tslint:disable-next-line:no-unused-expression
        new Watcher(configs);
    });

    gulp.task('live', [ 'config' ], () => {
        console.log(`\n${colors.yellow('===')} ${colors.green('Watch with reload is initiated')} ${colors.yellow('===')}\n`);

        let configs: IGulpConfigs = global.gulpConfigs;
        const build = getBuildInstance(configs);

        let liveReload = new LiveReload(configs.liveReload);
        liveReload.runServer();
        watch(configs.watch.assets, function (event) {
            console.log(event.path);
            gulp
                .src(event.path, {
                    base: configs.watch.base
                })
                .pipe(
                    $.spsave(
                        configs.spSaveCoreOptions,
                        configs.privateConf.creds
                    )
                )
                .pipe($.through.obj((chunk, enc, cb) => {
                    let chunkPath = chunk.path;
                    liveReload.emitUpdatedPath(chunkPath);
                    cb(null, chunk);
                }));
        });
        // tslint:disable-next-line:no-unused-expression
        new Watcher(configs);
    });

};
