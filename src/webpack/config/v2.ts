import * as path from 'path';
import * as minimist from 'minimist';

import { compileEnvHashedString } from '../../utils/env';
import { getWebpackConfigDefaults } from '../defaults';
import { getSettings } from '../settings';

import { IWebpackMapItem, IWebpackConfig } from '../../interfaces';

const args = minimist(process.argv.slice(2));
const webpackTargets = (args['webpack-targets'] || '').split(',')
  .map((t: string) => t.trim().toLowerCase())
  .filter((t: string) => t.length > 0);

const { appConf, privateConf, publishPath, defaultItemMap } = getSettings();

const webpackItemsMap: IWebpackMapItem[] = appConf.webpackItemsMap || [defaultItemMap];
const webpackConfigDefaults: IWebpackConfig = getWebpackConfigDefaults(appConf, privateConf, publishPath);

webpackConfigDefaults.name = '';
webpackConfigDefaults.entry = {};
webpackConfigDefaults.output = {
  path: path.join(process.cwd(), appConf.distFolder, (appConf.modulePath || ''), '/scripts'),
  filename: '[name].js',
  sourceMapFilename: `[name].js.map?v=[chunkhash:8]&e=.js.map`,
  chunkFilename: '[name]/[id]-[chunkhash:8].js?v=[chunkhash:8]&e=.chunk.js',
  publicPath: `${publishPath}/scripts/`
};

const webpackConfigs = webpackItemsMap
  .filter((mapItem) => {
    return webpackTargets.length !== 0
      ? true
      : mapItem.disable !== true; // do not filter disabled in strict mode
  })
  .filter((mapItem) => {
    if (webpackTargets.length === 0) {
      return true;
    }
    return (
      webpackTargets.indexOf(mapItem.target.toLowerCase()) !== -1 ||
      webpackTargets.indexOf((mapItem.name || '').toLowerCase()) !== -1
    );
  })
  .reduce((webpackCnfg, mapItem) => {
    mapItem.target = mapItem.target.replace('.js', '');
    webpackCnfg[0].name += (webpackCnfg[0].name || '').length > 0
      ? `, ${mapItem.name || mapItem.target}`
      : `${mapItem.name || mapItem.target}`;
    let output = [ mapItem.entry ];
    if (mapItem.includePolyfills === true) {
      output = [ require.resolve('../polyfills'), ...output ];
    }
    webpackCnfg[0].entry = {
      ...(webpackCnfg[0].entry || {} as any),
      [compileEnvHashedString(mapItem.target)]: output.map(compileEnvHashedString)
    };
    return webpackCnfg;
  }, [webpackConfigDefaults]);

module.exports = webpackConfigs;
