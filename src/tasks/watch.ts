import * as path from 'path';
import * as fs from 'fs';
import { Gulp } from 'gulp';
import * as webpack from 'webpack';
import sppurge, { IOptions as IPurgeOptions } from 'sppurge';
import { LiveReload } from 'sp-live-reload';

import { processStepMessage } from '../utils/log';
import { getConfigs } from './config';
import { Debounce, formatTime } from '../utils/misc';
import { getBuildInstance } from './build';
import { detectProdMode } from '../utils/env';

import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const watchTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  const { run } = new Debounce(50);

  const saveQueue: any = {};

  const spsave = async (filePath: string, throughCallback?: (err: any) => void): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
    saveQueue[filePath] = (saveQueue[filePath] || 0) + 1;
    console.log(`[${formatTime(new Date())}]`, 'Watch:',
      path.relative('./', filePath), fs.statSync(filePath).size,
      saveQueue[filePath] > 1 ? '(delayed)' : ''
    );
    if (saveQueue[filePath] === 1) {
      gulp
        .src(filePath, { base: configs.watch.base })
        .pipe($.spsave(configs.spSaveCoreOptions, configs.privateConf.creds))
        .pipe($.through.obj((chunk, enc, callback) => {
          if (throughCallback && typeof throughCallback === 'function') {
            const chunkPath = chunk.path;
            throughCallback(chunkPath);
          }
          saveQueue[filePath] -= 1;
          if (saveQueue[filePath] > 0) {
            delete saveQueue[filePath];
            spsave(filePath);
          }
          callback(null, chunk);
        }));
    }
  };

  const purge = async (filePath: string): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);

    const sppurgeOptions: IPurgeOptions = {
      folder: configs.appConfig.spFolder,
      localFilePath: filePath,
      localBasePath: configs.appConfig.distFolder
    };

    sppurge(configs.privateConf as any, sppurgeOptions)
      .then(res => {
        if (res.statusCode) {
          console.log('File has been deleted:', res.statusMessage);
        } else {
          console.log(res.statusCode, res.statusMessage);
        }
      })
      .catch(err => {
        if ((err.error || { error: { code: '' } }).error.code.split(',')[0] === '-2146232832') {
          console.log('File has not been removed as it was not there in SharePoint.');
        } else {
          console.log('Error:', err.message);
        }
      });
  };

  const webpackWatch = () => {
    processStepMessage('Watch Webpack');
    detectProdMode();

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
          aggregateTimeout: 300,
          poll: 1000,
          ignored: /node_modules/
        }
      };
    });
    webpack(webpackConfig, (err, stats) => {
      console.log(err || stats.toString({ colors: true }));
    });
  };

  const Watcher = function (configs: IGulpConfigs) {
    $.watch(`./src/masterpage/${configs.appConfig.masterpageCodeName}.${configs.appConfig.platformVersion || '___'}.hbs`.replace('.___.', '.'), (event) => {
      if (event.event !== 'unlink') {
        gulp.start('build:masterpage');
      }
    });
    $.watch('./src/masterpage/layouts/*.hbs', (event) => {
      if (event.event !== 'unlink') {
        gulp.start('build:layouts');
      }
    });
    $.watch('./src/styles/**/*.scss', (event) => {
      if (event.event !== 'unlink') {
        gulp.start('build:css-custom');
      }
    });
    $.watch([
      './src/scripts/**/*.js',
      './src/scripts/**/*.jsx',
      './src/scripts/**/*.ts',
      './src/scripts/**/*.tsx',
      '!./src/scripts/**/*.d.ts'
    ]).once('data', () => webpackWatch());
    $.watch('./src/webparts/**/*.hbs', (vinyl) => {
      if (vinyl.event !== 'unlink') {
        const build = getBuildInstance(configs);

        const serverPath: string = configs.privateConf.siteUrl.replace('://', '__').split('/')[0].replace('__', '://');
        const publishPath: string = `${configs.privateConf.siteUrl}/${configs.appConfig.spFolder}`.replace(serverPath, '');

        const packageData = require(path.join(process.cwd(), 'package.json'));
        const data = {
          serverPath,
          publishPath,
          masterpageName: configs.appConfig.masterpageCodeName,
          spRootFolder: configs.appConfig.spFolder,
          assetsVersion: packageData.version + '_' + (new Date()).getTime(),
          ...(configs.appConfig.masterpage || {})
        };
        const targetFolder = configs.appConfig.distFolder + '/webparts';

        const srcPath = path.relative('./src', vinyl.path);
        const relPath = path.relative(path.join('./src', 'webparts'), vinyl.path);
        const fileParse = path.parse(relPath);
        const trgPath = path.join(targetFolder, path.dirname(relPath), fileParse.name + '.html');

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
      }
    });
  };

  gulp.task('watch', async () => {
    processStepMessage('Watch Assets');
    detectProdMode();

    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);

    $.watch(configs.watch.assets, (event) => {
      if (event.event !== 'unlink') {
        run(event.path, () => {
          spsave(event.path);
        });
      } else if (configs.appConfig.deleteFiles) {
        purge(event.path);
      }
    });
    // tslint:disable-next-line:no-unused-expression
    new Watcher(configs);
  });

  gulp.task('live', async () => {
    processStepMessage('Watch with reload is initiated');
    detectProdMode();

    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
    // const build = getBuildInstance(configs);

    const liveReload = new LiveReload(configs.liveReload);
    liveReload.runServer();

    $.watch(configs.watch.assets, (event) => {
      if (event.event !== 'unlink') {
        run(event.path, () => {
          spsave(event.path, (chunkPath: string) => {
            let body: string;
            if (chunkPath.toLowerCase().split('.').pop() === 'css') {
              body = fs.readFileSync(chunkPath).toString();
            }
            liveReload.emitUpdatedPath(chunkPath, false, body);
          });
        });
      } else if (configs.appConfig.deleteFiles) {
        purge(event.path);
      }
    });
    // tslint:disable-next-line:no-unused-expression
    new Watcher(configs);
  });

};
