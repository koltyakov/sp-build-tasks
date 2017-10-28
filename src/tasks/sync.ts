import * as colors from 'colors';
const sppull = require('sppull').sppull;

import { Gulp } from 'gulp';
import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const syncTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('pull', ['config'], (cb) => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Fetching files from SharePoint')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
    let options = {
      spRootFolder: configs.appConfig.spFolder,
      dlRootFolder: configs.appConfig.distFolder
    };

    sppull(configs.privateConf, options)
      .then(() => {
        cb();
      })
      .catch((err) => {
        cb(err.message);
      });

  });

  gulp.task('push', ['config'], () => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Publishing assets to SharePoint')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
    return gulp
      .src(configs.watch.assets, { base: configs.watch.base })
      .pipe($.spsave(configs.spSaveCoreOptions, configs.privateConf.creds));

  });

};
