import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { IAppConfig, IPrivateConfig, IGulpConfigs, IWebpackMapItem } from '../interfaces';

export interface ISettings {
  appConf: IAppConfig;
  privateConf: IPrivateConfig;
  publishPath: string;
  defaultItemMap: IWebpackMapItem;
}

declare var global: any;
dotenv.config();

export const getSettings = (): ISettings => {
  const configs: IGulpConfigs = global.gulpConfigs;
  let appConf: IAppConfig = (configs || { appConfig: null }).appConfig;
  let privateConf: IPrivateConfig = (configs || { privateConf: null }).privateConf;

  if (!appConf) {
    appConf = require(path.join(process.cwd(), process.env.APP_JSON || './config/app.json'));
  }

  if (!privateConf) {
    privateConf = require(path.join(process.cwd(), process.env.PRIVATE_JSON || 'config/private.json'));
  }

  const publishPath: string = '/' + `${privateConf.siteUrl}/${appConf.spFolder}`
    .split('/').splice(3).join('/').replace(/\/\//g, '/');

  let defaultEntryExt = 'ts';
  const defEntryRoot = './src/scripts';
  [ 'js', 'jsx', 'ts', 'tsx' ].forEach((ext) => {
    if (fs.existsSync(path.join(process.cwd(), defEntryRoot, `index.${ext}`))) {
      defaultEntryExt = ext;
    }
  });
  const defaultItemMap: IWebpackMapItem = {
    entry: `${defEntryRoot}/index.${defaultEntryExt}`,
    target: 'app.js'
  };

  return {
    appConf,
    privateConf,
    publishPath,
    defaultItemMap
  };
};
