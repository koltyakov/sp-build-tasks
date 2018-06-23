import Deploy from '../utils/deploy';
import { ReloadProvisioning } from 'sp-live-reload';

import { Gulp } from 'gulp';

import { processStepMessage } from '../utils/log';
import { getConfigs } from './config';
import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

const applyLogo = async (settings: ISPBuildSettings) => {
  const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
  if (typeof configs.appConfig.masterpagePath !== 'undefined') {
    processStepMessage('Applying logotype to the web');
    const deploy = new Deploy({
      siteUrl: configs.privateConf.siteUrl,
      creds: configs.privateConf.creds,
      dist: configs.appConfig.distFolder,
      spFolder: configs.appConfig.spFolder
    });
    await deploy.applyLogotypeToWeb({
      logoPath: configs.appConfig.logoPath
    });
  }
  return;
};

export const deployTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('live-reload', async cb => {
    const args = process.argv.splice(3);
    const install = args.filter(arg => arg.toLowerCase() === '--uninstall').length === 0;
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
    const liveReload = new ReloadProvisioning(configs.liveReload);
    if (install) {
      processStepMessage('Installing live reload to site collection');
      liveReload.provisionMonitoringAction()
        .then(_ => {
          console.log('Custom action has been installed');
          cb();
        })
        .catch(cb);
    } else {
      processStepMessage('Retracting live reload from site collection');
      liveReload.retractMonitoringAction()
        .then(_ => {
          console.log('Custom action has been retracted');
          cb();
        })
        .catch(cb);
    }
  });

  gulp.task('masterpage', async cb => {
    const args = process.argv.splice(3);
    const install = args.filter(arg => arg.toLowerCase() === '--uninstall').length === 0;
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);

    const deploy = new Deploy({
      siteUrl: configs.privateConf.siteUrl,
      creds: configs.privateConf.creds,
      dist: configs.appConfig.distFolder,
      spFolder: configs.appConfig.spFolder
    });

    if (install) {
      await applyLogo(settings);
      processStepMessage('Applying masterpage to the web');

      if (typeof configs.appConfig.masterpagePath !== 'undefined') {
        deploy.applyMasterpageToWeb({
          masterpagePath: configs.appConfig.masterpagePath
        })
          .then(masterpageFullPath => {
            console.log('Masterpage has been applied: ' + masterpageFullPath);
            cb();
          })
          .catch(cb);
      } else {
        cb(`Property 'masterpagePath' is missed in ./config/app.json`);
      }
    } else {
      processStepMessage('Restoring masterpage on the web');

      deploy.applyMasterpageToWeb({
        spFolder: '/',
        masterpagePath: '_catalogs/masterpage/seattle.master'
      })
        .then(masterpageFullPath => {
          console.log('Masterpage has been applied: ' + masterpageFullPath);
          cb();
        })
        .catch(cb);
    }
  });

};
