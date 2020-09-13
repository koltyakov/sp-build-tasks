import * as path from 'path';
import * as fs from 'fs';
import { Gulp } from 'gulp';
import webpack from 'webpack';
import sppurge, { IOptions as IPurgeOptions } from 'sppurge';
import { LiveReload } from 'sp-live-reload';

import { processStepMessage } from '../utils/log';
import { getConfigs } from './config';
import { Debounce, formatTime } from '../utils/misc';
import { getBuildInstance, mapProjectData, BuildTasks } from './build';
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
        .pipe($.through.obj((chunk, _enc, callback) => {
          // if (throughCallback && typeof throughCallback === 'function') {
          if (typeof throughCallback !== 'undefined') {
            const chunkPath = chunk.path;
            throughCallback(chunkPath);
          }
          saveQueue[filePath] -= 1;
          if (saveQueue[filePath] > 0) {
            delete saveQueue[filePath];
            spsave(filePath).then(() => callback(null, chunk)).catch(console.warn);
          } else {
            callback(null, chunk);
          }
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
      // .then(res => {
      //   if (res.statusCode) {
      //     console.log('File has been deleted:', res.statusMessage);
      //   } else {
      //     console.log(res.statusCode, res.statusMessage);
      //   }
      // })
      .catch((err) => {
        if ((err.error || { error: { code: '' } }).error.code.split(',')[0] === '-2146232832') {
          console.log('File has not been removed as it was not there in SharePoint.');
        } else {
          console.log('Error:', err.message);
        }
      });
  };

  const buildTasks = new BuildTasks(settings);

  gulp.task('watch', () => {
    const args = process.argv.slice(3);
    const devServer = args.indexOf('--devServer') !== -1;
    const skipSync = devServer || args.indexOf('--skipSync') !== -1;
    detectProdMode();
    (async () => {
      const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
      if (!skipSync) {
        processStepMessage('Watch has been started');
        $.watch(configs.watch.assets, async (event) => {
          if (event.event !== 'unlink') {
            await new Promise((resolve, reject) => {
              run(event.path, () => {
                spsave(event.path)
                  .then(() => resolve())
                  .catch(reject);
              });
            });
          } else if (configs.appConfig.deleteFiles) {
            await purge(event.path);
          }
        });
      }
      watchAssets(buildTasks, configs, $, devServer);
    })()
      .catch(console.warn);
  });

  gulp.task('live', () => {
    processStepMessage('Watch with reload is initiated');
    detectProdMode();
    (async () => {
      const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
      const liveReload = new LiveReload(configs.liveReload);
      liveReload.runServer();
      $.watch(configs.watch.assets, async (event) => {
        if (event.event !== 'unlink') {
          await new Promise((resolve, reject) => {
            run(event.path, () => {
              spsave(event.path, (chunkPath: string) => {
                let body: string = '';
                if (chunkPath.toLowerCase().split('.').pop() === 'css') {
                  body = fs.readFileSync(chunkPath).toString();
                }
                liveReload.emitUpdatedPath(chunkPath, false, body);
              })
                .then(() => resolve())
                .catch(reject);
            });
          });
        } else if (configs.appConfig.deleteFiles) {
          await purge(event.path);
        }
      });
      watchAssets(buildTasks, configs, $, false);
    })()
      .catch(console.warn);
  });

};

export const watchAssets = (buildTasks: BuildTasks, configs: IGulpConfigs, $: any, devServer: boolean = false): void => {

  const webpackWatch = () => {
    let webpackConfigPath: string = path.join(process.cwd(), 'webpack.config.js');
    if (!fs.existsSync(webpackConfigPath)) {
      webpackConfigPath = path.join(__dirname, '../webpack/config.js');
    }
    let webpackConfig: any = require(webpackConfigPath);
    if (!Array.isArray(webpackConfig)) {
      webpackConfig = [webpackConfig];
    }
    webpackConfig = webpackConfig.map((w) => {
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

  $.watch(`./src/masterpage/${configs.appConfig.masterpageCodeName}.${configs.appConfig.platformVersion || '___'}.hbs`.replace('.___.', '.'), async (event) => {
    if (event.event !== 'unlink') {
      // gulp.start('build:masterpage');
      await buildTasks.buildMasterpagesTask();
    }
  });

  $.watch('./src/masterpage/layouts/*.hbs', async (event) => {
    if (event.event !== 'unlink') {
      // gulp.start('build:layouts');
      await buildTasks.buildLayoutsTask();
    }
  });

  $.watch('./src/styles/**/*.scss', async (event) => {
    if (event.event !== 'unlink') {
      // gulp.start('build:css-custom');
      await buildTasks.buildCustomCssTask();
    }
  });

  if (!devServer) {
    $.watch([
      // Watch `./src/stripts`'s folder scripts
      ...['js', 'jsx', 'ts', 'tsx'].map((ext) => `./src/scripts/**/*.${ext}`),
      // Watch custom entries which can be outside `./src/stripts`
      ...(
        typeof configs.appConfig.webpackItemsMap !== 'undefined'
          ? configs.appConfig.webpackItemsMap.map((c) => c.entry)
          : []
      ),
      // Ignore definitions
      '!./src/scripts/**/*.d.ts'
    ]).once('data', () => webpackWatch());
  }

  $.watch('./src/webparts/**/*.hbs', (vinyl) => {
    if (vinyl.event !== 'unlink') {
      const build = getBuildInstance(configs);
      const data = mapProjectData(configs);
      const targetFolder = configs.appConfig.distFolder + '/webparts';
      const srcPath = path.relative('./src', vinyl.path);
      const relPath = path.relative(path.join('./src', 'webparts'), vinyl.path);
      const fileParse = path.parse(relPath);
      const trgPath = path.join(targetFolder, path.dirname(relPath), fileParse.name + '.html');

      build.compileHbsTemplate({
        source: srcPath,
        target: trgPath,
        data
      })
        .then(() => console.log('Webpart is compiled', trgPath))
        .catch(console.log);
    }
  });

  // interface IWatchCopyAssets { watch: string; basePath: string; }
  // const { copyAssetsMap } = configs.appConfig;
  // if (copyAssetsMap) {
  //   const watchAssets: IWatchCopyAssets[] = copyAssetsMap.reduce((res, assets) => {
  //     let src: string[] = [];
  //     if (typeof assets.src === 'string') {
  //       src = [assets.src];
  //     } else {
  //       src = assets.src;
  //     }
  //     return res;
  //   }, []);
  // }

};
