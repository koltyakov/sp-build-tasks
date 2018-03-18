import * as webpack from 'webpack';
import * as UglifyJSPlugin from 'uglifyjs-webpack-plugin';
import * as path from 'path';
import * as fs from 'fs';

declare var global: any;

import {
  IWebpackMapItem,
  IWebpackConfig as IWebpackConfigOld,
  IGulpConfigs,
  IAppConfig,
  IPrivateConfig
} from '../interfaces';

interface IWebpackConfig extends IWebpackConfigOld {
  mode: 'development' | 'production';
}

const configs: IGulpConfigs = global.gulpConfigs;
let appConf: IAppConfig = (configs || { appConfig: null }).appConfig;
let privateConf: IPrivateConfig = (configs || { privateConf: null }).privateConf;

if (!appConf) {
  appConf = require(path.join(process.cwd(), 'config/app.json'));
}
if (!privateConf) {
  appConf = require(path.join(process.cwd(), 'config/private.json'));
}

const serverPath: string = privateConf.siteUrl.replace('://', '__').split('/')[0].replace('__', '://');
const publishPath: string = `${privateConf.siteUrl}/${appConf.spFolder}`.replace(serverPath, '');

let defaultEntryExt = 'ts';
const defEntryRoot = './src/scripts';

[ 'js', 'jsx', 'ts', 'tsx' ].forEach(ext => {
  if (fs.existsSync(path.join(process.cwd(), defEntryRoot, `index.${ext}`))) {
    defaultEntryExt = ext;
  }
});

const defaultItemMap: IWebpackMapItem = {
  entry: `${defEntryRoot}/index.${defaultEntryExt}`,
  target: 'app.js'
};

const webpackConfigDevDefaults: IWebpackConfig = {
  mode: 'development',
  cache: true,
  devtool: 'cheap-module-source-map',
  module: {
    rules: [{
      test: /\.ts(x?)$/,
      exclude: /(node_modules|dist)/,
      use: ['awesome-typescript-loader']
    }]
  },
  plugins: [
    new UglifyJSPlugin({ sourceMap: true })
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }
};

const webpackConfigProdDefaults: IWebpackConfig = {
  mode: 'production',
  cache: false,
  devtool: 'source-map',
  module: {
    rules: [{
      test: /\.ts(x?)$/,
      exclude: /(node_modules|dist)/,
      use: ['awesome-typescript-loader']
    }]
  },
  plugins: [
    new UglifyJSPlugin({ sourceMap: true }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }
};

const webpackConfigDefaults: IWebpackConfig =
  process.env.NODE_ENV === 'production' ?
    webpackConfigProdDefaults :
    webpackConfigDevDefaults;

const webpackItemsMap: IWebpackMapItem[] = appConf.webpackItemsMap || [defaultItemMap];

module.exports = webpackItemsMap.map(mapItem => {
  const filename = mapItem.target || defaultItemMap.target;
  const name = path.parse(filename).name;
  return {
    ...webpackConfigDefaults,
    // ...(appConfig.webpackConfig || {}),
    ...(mapItem.webpackConfig || {}),
    entry: mapItem.entry || defaultItemMap.entry,
    output: {
      path: path.join(process.cwd(), appConf.distFolder, (appConf.modulePath || ''), '/scripts'),
      filename: filename,
      sourceMapFilename: `${name}/[name].js.map?v=[chunkhash:8]&e=.js.map`,
      chunkFilename:  `${name}/[name].chunk.js?v=[chunkhash:8]&e=.chunk.js`,
      ...((mapItem.webpackConfig || {}).output || {}),
      publicPath: `${publishPath}/scripts/`
    }
  } as IWebpackConfig;
});
