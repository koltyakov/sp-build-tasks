import * as path from 'path';
import minimist from 'minimist';

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
  .map((mapItem) => {
    const filename = mapItem.target || defaultItemMap.target;
    const name = path.parse(filename).name;
    const entry: string[] = [];
    if (mapItem.includePolyfills === true) {
      entry.push(require.resolve('../polyfills'));
    }
    entry.push(mapItem.entry || defaultItemMap.entry);
    const conf: IWebpackConfig = {
      name: mapItem.name,
      ...webpackConfigDefaults,
      ...(mapItem.webpackConfig || {}),
      entry: entry.map(compileEnvHashedString),
      output: {
        path: path.join(process.cwd(), appConf.distFolder, (appConf.modulePath || ''), '/scripts'),
        filename,
        sourceMapFilename: `${name}/[name].js.map?v=[chunkhash:8]&e=.js.map`,
        chunkFilename: `${name}/[name].chunk.js?v=[chunkhash:8]&e=.chunk.js`,
        publicPath: `${publishPath}/scripts/`,
        ...(mapItem.webpackConfig || { output: {} }).output
      }
    };
    return conf;
  });

module.exports = webpackConfigs;
