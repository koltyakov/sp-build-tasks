import * as colors from 'colors';
import { Gulp } from 'gulp';
import { exec } from 'child_process';
import { join } from 'path';

import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const analyzeTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('analyze', (cb) => {
    console.log(`\n${colors.red('===')} ${colors.green('Analyze Webpack Bundle')} ${colors.yellow('===')}\n`);
    let configs: IGulpConfigs = global.gulpConfigs;
    // ToDo: get destinations from webpack settings
    exec(`source-map-explorer ${configs.appConfig.distFolder}/app.*`, (err, stdout, stderr) => {
      if (err) {
        return cb(err);
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
      cb();
    });
  });

};
