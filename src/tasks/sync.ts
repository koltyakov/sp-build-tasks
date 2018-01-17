import * as colors from 'colors';
import * as path from 'path';
import { Gulp } from 'gulp';
const sppull = require('sppull').sppull;

import Files from './../utils/files';

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

  gulp.task('push:diff', ['config'], (cb) => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Publishing assets to SharePoint (incremental mode)')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
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
          let fileRelativePath = path.relative(chunk.base, chunk.path).replace(/\\/g, '/');
          let remoteFiles = files.filter(file => {
            return file.relativePath === fileRelativePath;
          });
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
        .on('finish', () => {
          cb();
        });
    });

  });

};
