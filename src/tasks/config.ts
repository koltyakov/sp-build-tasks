import * as path from 'path';
import * as fs from 'fs';
import { AuthConfig } from 'node-sp-auth-config';
import { IAuthOptions } from 'node-sp-auth';
import { Gulp } from 'gulp';
import * as minimist from 'minimist';

import { ISPBuildSettings, IAppConfig, IGulpConfigs } from '../interfaces';
import { parseObjectChain } from '../utils/misc';

declare var global: any;

const getConfigsData = (settings: ISPBuildSettings, forcePrompts: boolean = false): Promise<IGulpConfigs> => {
  const args = process.argv.slice(3);
  const params: any = minimist(args);

  const mapGulpConfigs = (appConfig: IAppConfig, privateConfig: any): IGulpConfigs => {
    const siteUrl = parseObjectChain<string>(() => params.privateConfig.siteUrl) || privateConfig.siteUrl;
    const gulpConfigs: IGulpConfigs = {
      appConfig: {
        ...appConfig,
        masterpageCodeName: appConfig.masterpageCodeName || 'Frankfurt',
        deleteFiles: typeof appConfig.deleteFiles !== 'undefined' ? appConfig.deleteFiles : false
      },
      privateConf: {
        siteUrl,
        creds: {
          ...(privateConfig.authOptions as IAuthOptions)
        }
      },
      spSaveCoreOptions: {
        siteUrl,
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
        siteUrl,
        protocol: siteUrl.indexOf('https://') !== -1 ? 'https' : 'http',
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
    global.spBuildAppConfig = global.spBuildAppConfig || require(path.resolve(settings.appConfig || './config/app.json'));
    if (typeof global.spBuildContext === 'undefined') {
      const authConfig = new AuthConfig({
        configPath: path.resolve(settings.privateConf || './config/private.json'),
        encryptPassword: true,
        saveConfigOnDisk: true,
        forcePrompts,
        headlessMode: !forcePrompts
      });
      authConfig.getContext()
        .then(context => {
          global.spBuildContext = context;
          global.gulpConfigs = mapGulpConfigs(global.spBuildAppConfig, global.spBuildContext);
          resolve(global.gulpConfigs);
        })
        .catch(reject);
    } else {
      global.gulpConfigs = mapGulpConfigs(global.spBuildAppConfig, global.spBuildContext);
      resolve(global.gulpConfigs);
    }
  });
};

const getCustomData = (settings: ISPBuildSettings, gulpConfigs: IGulpConfigs): Promise<IGulpConfigs> => {
  return new Promise((resolve, reject) => {
    if (!settings.taskPath) {
      return reject('No task path is defined');
    }
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

export const getConfigs = (settings: ISPBuildSettings, force: boolean = false): Promise<IGulpConfigs> => {
  return getConfigsData(settings, force).then(conf => getCustomData(settings, conf));
};

const execConfigTask = (settings: ISPBuildSettings, force: boolean, cb: (err?: any) => void) => {
  getConfigs(settings, force).then(_ => cb()).catch(cb);
};

export const configTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {
  gulp.task('config', cb => {
    const args = process.argv.slice(3);
    const force = args.filter(arg => arg.toLowerCase() === '--init').length > 0;
    execConfigTask(settings, force, cb);
  });
};
