import * as path from 'path';
import { AuthConfig } from 'node-sp-auth-config';
import { IAuthOptions } from 'node-sp-auth';

import { Gulp } from '@types/gulp';
import {
    ISPBuildSettings, IAppConfig, IPrivateConfig, IGulpConfigs
} from '../interfaces';

declare var global: any;

export const getConfigs = (settings: ISPBuildSettings): Promise<any> => {
    const mapGulpConfigs = (appConfig: IAppConfig, privateConfig: any): IGulpConfigs => {
        let gulpConfigs: IGulpConfigs = {
            appConfig: {
                ...appConfig,
                masterpageCodeName: appConfig.masterpageCodeName || 'platypus'
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
                assets: appConfig.distFolder.replace('./', '') + '/**/*.*',
                base: appConfig.distFolder.replace('./', '')
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
            saveConfigOnDisk: true
        });
        if (typeof global.spBuildContext === 'undefined') {
            authConfig.getContext()
                .then((context: any) => {
                    global.spBuildContext = context;
                    global.gulpConfigs = mapGulpConfigs(global.spBuildAppConfig, global.spBuildContext);
                    resolve();
                })
                .catch(reject);
        } else {
            global.gulpConfigs = mapGulpConfigs(global.spBuildAppConfig, global.spBuildContext);
            resolve();
        }
    });
};

export const configTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

    gulp.task('config', (cb) => {
        getConfigs(settings)
            .then(() => {
                cb();
            })
            .catch((err) => {
                cb(err.message);
            });
    });

};
