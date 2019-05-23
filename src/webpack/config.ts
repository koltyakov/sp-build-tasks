import * as webpack from 'webpack';
import * as UglifyJSPlugin from 'uglifyjs-webpack-plugin';
import * as path from 'path';
import * as fs from 'fs';
import RestProxy, { IProxySettings } from 'sp-rest-proxy/dist/RestProxy';
import * as minimist from 'minimist';
import * as dotenv from 'dotenv';

import { TsConfigPathsPlugin } from 'awesome-typescript-loader';

declare var global: any;
dotenv.config();

import {
  IWebpackMapItem,
  IWebpackConfig,
  IGulpConfigs,
  IAppConfig,
  IPrivateConfig
} from '../interfaces';
import { compileEnvHashedString } from '../utils/env';

const args = minimist(process.argv.slice(2));
const webpackTargets = (args['webpack-targets'] || '').split(',')
  .map(t => t.trim().toLowerCase())
  .filter(t => t.length > 0);

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

[ 'js', 'jsx', 'ts', 'tsx' ].forEach(ext => {
  if (fs.existsSync(path.join(process.cwd(), defEntryRoot, `index.${ext}`))) {
    defaultEntryExt = ext;
  }
});

const defaultItemMap: IWebpackMapItem = {
  entry: `${defEntryRoot}/index.${defaultEntryExt}`,
  target: 'app.js'
};

const rules: webpack.RuleSetRule[] = [
  {
    test: /\.ts(x?)$/,
    exclude: /(node_modules|dist)/,
    use: [ 'awesome-typescript-loader' ]
  },
  {
    test: /\.css$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader', options: { sourceMap: true } }
    ]
  },
  {
    test: /\.scss$/,
    use: [
      { loader: 'style-loader' },
      { loader: 'css-loader', options: { sourceMap: true } },
      { loader: 'sass-loader', options: { sourceMap: true } }
    ]
  }
];

let devtool: webpack.Options.Devtool | undefined = (process.env.SPBUILD_WEBPACK_DEVTOOL || appConf.devtool) as any;
devtool = typeof devtool !== 'undefined' ? devtool : 'source-map';
if (`${devtool}` === 'none' || `${devtool}` === '') {
  devtool = undefined;
}

// Webpack dev server options
const devServerPort = parseInt(process.env.SPBUILD_WEBPACK_PORT || '9090', 10);
const devServer = {
  contentBase: path.join(process.cwd(), appConf.distFolder),
  watchContentBase: true,
  writeToDisk: true,
  hot: true,
  port: devServerPort,
  before: (app, _server) => {
    // Register SP API Proxy
    const settings: IProxySettings = {
      port: devServerPort,
      authConfigSettings: {
        authOptions: { ...privateConf, ...privateConf.creds },
        saveConfigOnDisk: false
      },
      strictRelativeUrls: true
    };
    new RestProxy(settings, app).serveProxy();

    // Register static assets under the publish path route
    app.get(`${publishPath}/*`, (req: any, res: any, _next: any) => {
      const filePath = path.join(
        process.cwd(),
        appConf.distFolder,
        req.url.replace(publishPath, '').split('?')[0]
      );
      res.sendFile(filePath);
    });
  }
};

const webpackConfigDevDefaults: IWebpackConfig = {
  mode: 'development',
  cache: true,
  devtool, // : appConf.devtool || 'source-map', // 'eval-source-map',
  devServer,
  module: { rules },
  resolve: {
    extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
    plugins: [ new TsConfigPathsPlugin() ]
  }
};

const webpackConfigProdDefaults: IWebpackConfig = {
  mode: 'production',
  cache: false,
  devtool, // : 'source-map',
  devServer,
  module: { rules },
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        cache: true,
        parallel: true,
        uglifyOptions: {
          ecma: 5,
          compress: true,
          mangle: true,
          output: {
            comments: false
          }
        },
        sourceMap: true
      })
    ]
  },
  resolve: {
    extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
    plugins: [ new TsConfigPathsPlugin() ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    })
  ]
};

const webpackConfigDefaults: IWebpackConfig = process.env.NODE_ENV === 'production' ? webpackConfigProdDefaults : webpackConfigDevDefaults;

const webpackItemsMap: IWebpackMapItem[] = appConf.webpackItemsMap || [defaultItemMap];

const webpackConfigs = webpackItemsMap
  .filter(mapItem => {
    return webpackTargets.length !== 0
      ? true
      : mapItem.disable !== true; // do not filter disabled in strict mode
  })
  .filter(mapItem => {
    if (webpackTargets.length === 0) {
      return true;
    }
    return (
      webpackTargets.indexOf(mapItem.target.toLowerCase()) !== -1 ||
      webpackTargets.indexOf((mapItem.name || '').toLowerCase()) !== -1
    );
  })
  .map(mapItem => {
    const filename = mapItem.target || defaultItemMap.target;
    const name = path.parse(filename).name;
    const entry: string[] = [];
    if (mapItem.includePolyfills === true) {
      entry.push(require.resolve('./polyfills'));
    }
    entry.push(mapItem.entry || defaultItemMap.entry);
    return {
      name: mapItem.name,
      ...webpackConfigDefaults,
      ...(mapItem.webpackConfig || {}),
      entry: entry.map(compileEnvHashedString),
      output: {
        path: path.join(process.cwd(), appConf.distFolder, (appConf.modulePath || ''), '/scripts'),
        filename: filename,
        sourceMapFilename: `${name}/[name].js.map?v=[chunkhash:8]&e=.js.map`,
        chunkFilename: `${name}/[name].chunk.js?v=[chunkhash:8]&e=.chunk.js`,
        publicPath: `${publishPath}/scripts/`,
        ...(mapItem.webpackConfig || { output: {} }).output
      }
    } as IWebpackConfig;
  });

module.exports = webpackConfigs;
