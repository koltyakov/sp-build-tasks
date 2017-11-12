import * as colors from 'colors';
import Deploy from '../utils/deploy';
const LiveReload = require('sp-live-reload');

import { Gulp } from 'gulp';
import { ISPBuildSettings, IGulpConfigs, IDeploySettings } from '../interfaces';

declare var global: any;

export const deployTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('reload:install', ['config'], (cb) => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Installing live reload to site collection')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
    let liveReload = new LiveReload(configs.liveReload);
    liveReload.provisionMonitoringAction()
      .then(() => {
        console.log('Custom action has been installed');
        cb();
      })
      .catch((err) => {
        console.log(err.message);
        cb();
      });

  });

  gulp.task('reload:retract', ['config'], (cb) => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Retracting live reload from site collection')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
    let liveReload = new LiveReload(configs.liveReload);
    liveReload.retractMonitoringAction()
      .then(() => {
        console.log('Custom action has been retracted');
        cb();
      })
      .catch((err) => {
        console.log(err.message);
        cb();
      });

  });

  gulp.task('masterpage:restore', ['config'], (cb) => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Restoring masterpage on the web')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
    let deploy = new Deploy({
      siteUrl: configs.privateConf.siteUrl,
      creds: configs.privateConf.creds,
      dist: configs.appConfig.distFolder,
      spFolder: configs.appConfig.spFolder
    });
    deploy.applyMasterpageToWeb({
      spFolder: '/',
      masterpagePath: '_catalogs/masterpage/seattle.master'
    })
      .then((masterpageFullPath) => {
        console.log('Masterpage has been applied: ' + masterpageFullPath);
        cb();
      })
      .catch((err) => {
        cb(err.message);
      });
  });

  gulp.task('masterpage:apply', ['logo:apply', 'config'], (cb) => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Applying masterpage to the web')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
    if (typeof configs.appConfig.masterpagePath !== 'undefined') {
      let deploy = new Deploy({
        siteUrl: configs.privateConf.siteUrl,
        creds: configs.privateConf.creds,
        dist: configs.appConfig.distFolder,
        spFolder: configs.appConfig.spFolder
      });
      deploy.applyMasterpageToWeb({
        masterpagePath: configs.appConfig.masterpagePath
      })
        .then((masterpageFullPath) => {
          console.log('Masterpage has been applied: ' + masterpageFullPath);
          cb();
        })
        .catch((err) => {
          cb(err.message);
        });
    } else {
      cb(`Property 'masterpagePath' is missed in ./config/app.json`);
    }
  });

  gulp.task('logo:apply', ['config'], (cb) => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Applying logotype to the web')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
    if (typeof configs.appConfig.masterpagePath !== 'undefined') {
      let deploy = new Deploy({
        siteUrl: configs.privateConf.siteUrl,
        creds: configs.privateConf.creds,
        dist: configs.appConfig.distFolder,
        spFolder: configs.appConfig.spFolder
      });
      deploy.applyLogotypeToWeb({
        logoPath: configs.appConfig.logoPath
      })
        .then((logoFullPath) => {
          cb();
        })
        .catch((err) => {
          cb(err.message);
        });
    } else {
      cb(`Property 'logoPath' is missed in ./config/app.json`);
    }
  });

};
