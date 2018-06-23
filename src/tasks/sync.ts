import * as path from 'path';
import { Gulp } from 'gulp';
const sppull = require('sppull').sppull;

import Files from './../utils/files';

import { processStepMessage } from '../utils/log';
import { getConfigs } from './config';
import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const syncTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('pull', async cb => {
    processStepMessage('Fetching files from SharePoint');

    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
    const options = {
      spRootFolder: configs.appConfig.spFolder,
      dlRootFolder: configs.appConfig.distFolder
    };

    sppull(configs.privateConf, options)
      .then(_ => cb())
      .catch(err => {
        cb(err.message);
      });

  });

  gulp.task('push', async cb => {

    const args = process.argv.splice(3);
    const diff = args.filter(arg => arg.toLowerCase() === '--diff').length > 0;

    processStepMessage(`Publishing assets to SharePoint${ diff ? ' (incremental mode)' : '' }`);

    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);

    if (!diff) {
      return gulp
        .src(configs.watch.assets, { base: configs.watch.base })
        .pipe($.spsave(configs.spSaveCoreOptions, configs.privateConf.creds));
    } else {
      // Incrementall mode
      const utils = new Files({
        siteUrl: configs.privateConf.siteUrl,
        creds: configs.privateConf.creds,
        dist: configs.appConfig.distFolder,
        spFolder: configs.appConfig.spFolder
      });

      utils.getFiles().then(files => {
        gulp
          .src(configs.watch.assets, { base: configs.watch.base })
          .pipe($.through.obj(function (chunk, _, next) {
            const fileRelativePath = path.relative(chunk.base, chunk.path).replace(/\\/g, '/');
            const remoteFiles = files.filter(file => file.relativePath === fileRelativePath);
            if (remoteFiles.length === 1) {
              // Different size
              if (remoteFiles[0].length !== chunk.contents.length) {
                this.push(chunk);
              }
            } else {
              this.push(chunk);
            }
            next();
          }))
          .pipe($.spsave(configs.spSaveCoreOptions, configs.privateConf.creds))
          .on('finish', _ => cb());
      });
    }

  });

};
