import { getWebpackConfigDefaults as getWebpackConfigProdDefaults } from './prod';
import { getWebpackConfigDefaults as getWebpackConfigDevDefaults } from './dev';

import { IWebpackConfig, IAppConfig, IPrivateConfig } from '../../interfaces';

export const getWebpackConfigDefaults = (appConf: IAppConfig, privateConf: IPrivateConfig, publishPath: string): IWebpackConfig =>
  process.env.NODE_ENV === 'production'
    ? getWebpackConfigProdDefaults(appConf, privateConf, publishPath)
    : getWebpackConfigDevDefaults(appConf, privateConf, publishPath);
