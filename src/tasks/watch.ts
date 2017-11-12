import * as colors from 'colors';
import * as path from 'path';
import * as fs from 'fs';
import { Gulp } from 'gulp';
import * as webpack from 'webpack';
const LiveReload = require('sp-live-reload');

import { Debounce } from '../utils/misc';
import Build from '../utils/build';
import { getBuildInstance } from './build';

import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const watchTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  const { run } = new Debounce(50);

  const Watcher = function (configs: IGulpConfigs) {
    $.watch(`./src/masterpage/${configs.appConfig.masterpageCodeName}.${configs.appConfig.platformVersion || '___'}.hbs`.replace('.___.', '.'), () => {
      gulp.start('build:masterpage');
    });
    $.watch('./src/masterpage/layouts/*.hbs', () => {
      gulp.start('build:layouts');
    });
    $.watch('./src/styles/**/*.scss', () => {
      gulp.start('build:css-custom');
    });
    $.watch([
      './src/scripts/**/*.js',
      './src/scripts/**/*.jsx',
      './src/scripts/**/*.ts',
      './src/scripts/**/*.tsx',
      '!./src/scripts/**/*.d.ts'
    ]).once('data', () => {
      gulp.start('watch:webpack');
    });
    $.watch('./src/webparts/**/*.hbs', (vinyl) => {
      const build = getBuildInstance(configs);

      let serverPath: string = configs.privateConf.siteUrl.replace('://', '__').split('/')[0].replace('__', '://');
      let publishPath: string = `${configs.privateConf.siteUrl}/${configs.appConfig.spFolder}`.replace(serverPath, '');

      let packageData = require(path.join(process.cwd(), 'package.json'));
      let data = {
        serverPath,
        publishPath,
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

  gulp.task('watch:prod', ['env:prod', 'watch']);
  gulp.task('watch:dev', ['env:dev', 'watch']);

  gulp.task('watch:webpack', ['config'], () => {
    let webpackConfigPath: string = path.join(process.cwd(), 'webpack.config.js');
    if (!fs.existsSync(webpackConfigPath)) {
      webpackConfigPath = path.join(__dirname, '../webpack/config.js');
    }
    let webpackConfig: any = require(webpackConfigPath);
    if (!Array.isArray(webpackConfig)) {
      webpackConfig = [webpackConfig];
    }
    webpackConfig = webpackConfig.map(w => {
      return {
        ...w,
        watch: true,
        watchOptions: {
          watchDelay: 200
        }
      };
    });
    webpack(webpackConfig, (err, stats) => {
      console.log(err || stats.toString({ colors: true }));
    });
  });

  gulp.task('watch', ['config'], (cb) => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Watch Assets')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;

    $.watch(configs.watch.assets, (event) => {
      run(event.path, () => {
        console.log('Watch:', path.relative('./', event.path), fs.statSync(event.path).size);
        gulp
          .src(event.path, {
            base: configs.watch.base
          })
          .pipe($.spsave(
            configs.spSaveCoreOptions,
            configs.privateConf.creds
          ));
      });
    });
    // tslint:disable-next-line:no-unused-expression
    new Watcher(configs);
  });

  gulp.task('live', ['config'], (cb) => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Watch with reload is initiated')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
    const build = getBuildInstance(configs);

    let liveReload = new LiveReload(configs.liveReload);
    liveReload.runServer();

    $.watch(configs.watch.assets, (event) => {
      run(event.path, () => {
        console.log('Watch:', path.relative('./', event.path), fs.statSync(event.path).size);
        gulp
          .src(event.path, {
            base: configs.watch.base
          })
          .pipe($.spsave(
            configs.spSaveCoreOptions,
            configs.privateConf.creds
          ))
          .pipe($.through.obj((chunk, enc, callback) => {
            let chunkPath = chunk.path;
            liveReload.emitUpdatedPath(chunkPath);
            callback(null, chunk);
          }));
      });
    });
    // tslint:disable-next-line:no-unused-expression
    new Watcher(configs);
  });

};
