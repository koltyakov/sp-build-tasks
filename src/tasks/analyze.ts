import * as colors from 'colors';
import { Gulp } from 'gulp';
import { join } from 'path';

import { getConfigs } from './config';
import { execPromise } from '../utils/misc';
import { extractSourcemapPath } from '../utils/files';

import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const analyzeTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('analyze', cb => {

    console.log(`\n${colors.red('===')} ${colors.green('Analyze Webpack Bundle')} ${colors.yellow('===')}\n`);

    (async () => {
      const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
      const webpackItemsMaps = configs.appConfig.webpackItemsMap || [{
        entry: './src/scripts/index.ts',
        target: 'app.js'
      }];
      for (const item of webpackItemsMaps) {
        const target = `${configs.appConfig.distFolder}/scripts/${item.target}`;
        let sourceMap = extractSourcemapPath(target);
        if (sourceMap) {
          sourceMap = `${configs.appConfig.distFolder}/scripts/${sourceMap.split('?')[0]}`;
          const res = await execPromise(`${join(process.cwd(), 'node_modules/.bin', 'source-map-explorer')} ${target} ${sourceMap}`);
          res.stdout && console.log(`${res.stdout}`);
          res.stderr && console.log(`${res.stderr}`);
        } else {
          console.log(`No source map found in ${target}`);
        }
      }
    })()
      .then(_ => cb())
      .catch(cb);

  });

};
