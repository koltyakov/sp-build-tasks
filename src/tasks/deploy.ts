import { Gulp } from 'gulp';
import * as path from 'path';
import { sp, Web } from '@pnp/sp';
import { ReloadProvisioning } from 'sp-live-reload';

import Deploy from '../utils/deploy';
import { setupPnp } from '../utils/pnpjs';
import { Hashes } from '../utils/hashes';
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

  gulp.task('custom-actions', async cb => {
    const args = process.argv.splice(3);
    const install = args.filter(arg => arg.toLowerCase() === '--uninstall').length === 0;
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);

    const customActions = configs.appConfig.customActions || [];
    const moduleName = require(path.join(process.cwd(), 'package.json'));

    if (customActions.length === 0) {
      console.log('No custom actions in app.json to deal with.');
      return cb();
    }

    await setupPnp(settings);

    if (install) {
      processStepMessage('Installing custom actions');
      const hashes = new Hashes({ sp, configs });
      for (const ca of customActions) {
        const url = await hashes.replaceHashedUrl(ca.scriptSrc);
        if (url !== null) {
          const filename = url.split('/').pop();
          const actionTitle = `${moduleName}${ca.name ? ` - ${ca.name}` : ''} (${filename})`;

          const payload: any = {
            Location: 'ScriptLink',
            Title: actionTitle,
            Sequence: '100'
          };

          if (hashes.isHashedUrl(url)) {
            payload.ScriptSrc = url;
          } else {
            payload.ScriptSrc = null;
            payload.ScriptBlock = getCustomActionScriptBlock(url);
          }

          if (ca.scope === 'web') {
            await sp.web.userCustomActions
              .add(payload)
              .then(_ => {
                console.log(`${actionTitle} has been added`);
              })
              .catch(console.log);
          }

          if (ca.scope === 'site') {
            await sp.site.userCustomActions
              .add(payload)
              .then(_ => {
                console.log(`${actionTitle} has been added`);
              })
              .catch(console.log);
          }

        } else {
          console.log(`Can't resolve custom action URI: ${ca.scriptSrc}`);
        }
      }
    } else {
      processStepMessage('Uninstalling custom actions');
      const webActions = await sp.web.userCustomActions.filter(`startswith(Title,'${moduleName} (')`).get();
      const siteActions = await sp.site.userCustomActions.filter(`startswith(Title,'${moduleName} (')`).get();
      for (const ca of webActions) {
        await sp.web.userCustomActions.getById(ca.Id).delete();
        console.log(`${ca.Title} has been deleted`);
      }
      for (const ca of siteActions) {
        await sp.site.userCustomActions.getById(ca.Id).delete().then(_ => {
          console.log(`${ca.Title} has been deleted`);
        }).catch(console.log);
      }
    }
  });

};

const getCustomActionScriptBlock = (scriptUri: string) => {
  const packageData = require(path.join(process.cwd(), 'package.json'));
  const assetsVersion = packageData.version + '_' + new Date().getTime();
  const ext = scriptUri.split('.').pop().toLowerCase();
  return ext === 'js' ? `
    (function() {
      var headEl = document.getElementsByTagName('head')[0];
      var scriptEl = document.createElement('script');
      scriptEl.type = 'text/javascript';
      scriptEl.src = '${scriptUri}?v=${assetsVersion}&ext=.js';
      headEl.appendChild(scriptEl);
    })();
  `.trim().split('\n').join('') : `
    (function() {
      var headEl = document.getElementsByTagName('head')[0];
      var styleEl = document.createElement('link');
      styleEl.type = 'text/css';
      styleEl.rel = 'stylesheet';
      styleEl.href = '${scriptUri}?v=${assetsVersion}&ext=.css';
      headEl.appendChild(styleEl);
    })();
  `.trim().split('\n').join('');
};
