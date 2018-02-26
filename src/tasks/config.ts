import * as path from 'path';
import * as fs from 'fs';
import { AuthConfig } from 'node-sp-auth-config';
import { IAuthOptions } from 'node-sp-auth';
import { Gulp } from 'gulp';

import {
  ISPBuildSettings, IAppConfig, IPrivateConfig, IGulpConfigs
} from '../interfaces';

declare var global: any;

export const getConfigs = (settings: ISPBuildSettings, forcePrompts: boolean = false): Promise<IGulpConfigs> => {
  const mapGulpConfigs = (appConfig: IAppConfig, privateConfig: any): IGulpConfigs => {
    let gulpConfigs: IGulpConfigs = {
      appConfig: {
        ...appConfig,
        masterpageCodeName: appConfig.masterpageCodeName || 'Frankfurt',
        deleteFiles: typeof appConfig.deleteFiles !== 'undefined' ? appConfig.deleteFiles : false
      },
      privateConf: {
        siteUrl: privateConfig.siteUrl,
        creds: {
          ...(privateConfig.authOptions as IAuthOptions)
        }
      },
      spSaveCoreOptions: {
        siteUrl: privateConfig.siteUrl,
        folder: appConfig.spFolder,
        flatten: false,
        checkin: true,
        checkinType: 1
      },
      watch: {
        assets: path.resolve(appConfig.distFolder) + '/**/*.*',
        base: path.resolve(appConfig.distFolder)
      },
      liveReload: {
        siteUrl: privateConfig.siteUrl,
        protocol: privateConfig.siteUrl.indexOf('https://') !== -1 ? 'https' : 'http',
        host: 'localhost',
        port: 3000,
        watchBase: path.join(process.cwd(), appConfig.distFolder.replace('./', '')),
        spFolder: appConfig.spFolder,
        ssl: {
          key: path.join(process.cwd(), './config/ssl/key.pem'),
          cert: path.join(process.cwd(), '/config/ssl/cert.crt')
        },
        creds: {
          ...privateConfig,
          ...privateConfig.authOptions
        }
      }
    };
    return gulpConfigs;
  };
  return new Promise((resolve, reject) => {
    global.spBuildAppConfig = global.spBuildAppConfig || require(path.resolve(settings.appConfig));
    const authConfig = new AuthConfig({
      configPath: path.resolve(settings.privateConf),
      encryptPassword: true,
      saveConfigOnDisk: true,
      forcePrompts: forcePrompts
    });
    if (typeof global.spBuildContext === 'undefined') {
      authConfig.getContext()
        .then((context: any) => {
          global.spBuildContext = context;
          global.gulpConfigs = mapGulpConfigs(global.spBuildAppConfig, global.spBuildContext);
          resolve(global.gulpConfigs);
        })
        .catch(reject);
    } else {
      global.gulpConfigs = mapGulpConfigs(global.spBuildAppConfig, global.spBuildContext);
      process.nextTick(() => {
        resolve(global.gulpConfigs);
      });
    }
  });
};

export const getCustomData = (settings: ISPBuildSettings, gulpConfigs: IGulpConfigs): Promise<IGulpConfigs> => {
  return new Promise(resolve => {
    const customDataModulePath = path.join(process.cwd(), settings.taskPath, 'customDataLoader.js');
    if (fs.existsSync(customDataModulePath)) {
      const customDataLoader = require(customDataModulePath);
      if (customDataLoader && typeof customDataLoader === 'function') {
        customDataLoader(settings, gulpConfigs)
          .then(customData => {
            global.gulpConfigs = {
              ...gulpConfigs,
              appConfig: {
                ...gulpConfigs.appConfig,
                customData: {
                  ...(customData || {})
                }
              }
            };
            resolve(global.gulpConfigs);
          })
          .catch(err => {
            console.log(err);
            resolve(gulpConfigs);
          });
      }
    } else {
      resolve(gulpConfigs);
    }
  });
};

export const configTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('config', (cb) => {
    getConfigs(settings)
      .then(gulpConfigs => getCustomData(settings, gulpConfigs))
      .then(() => {
        cb();
      })
      .catch((err) => {
        cb(err.message);
      });
  });

  gulp.task('config:force', (cb) => {
    getConfigs(settings, true)
      .then(gulpConfigs => getCustomData(settings, gulpConfigs))
      .then(() => {
        cb();
      })
      .catch((err) => {
        cb(err.message);
      });
  });

};
