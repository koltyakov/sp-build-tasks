import * as webpack from 'webpack';
import * as UglifyJSPlugin from 'uglifyjs-webpack-plugin';
import * as path from 'path';
import * as fs from 'fs';

import { TsConfigPathsPlugin } from 'awesome-typescript-loader';
// import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';

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
  privateConf = require(path.join(process.cwd(), 'config/private.json'));
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

// const cacheLoader = {
//   loader: 'cache-loader',
//   options: {
//     cacheDirectory: path.join(process.cwd(), 'cache')
//   }
// };

const rules: webpack.RuleSetRule[] = [
  {
    test: /\.ts(x?)$/,
    exclude: /(node_modules|dist)/,
    use: [ 'awesome-typescript-loader' ] // cacheLoader,
  },
  {
    test: /\.css$/,
    use: [
      // cacheLoader,
      {
        loader: 'style-loader'
      },
      {
        loader: 'css-loader',
        options: {
          sourceMap: true
        }
      }
    ]
  },
  {
    test: /\.scss$/,
    use: [
      // cacheLoader,
      {
        loader: 'style-loader'
      },
      {
        loader: 'css-loader',
        options: {
          sourceMap: true
        }
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: true
        }
      }
    ]
  }
];

const webpackConfigDevDefaults: IWebpackConfig = {
  mode: 'development',
  cache: true,
  devtool: appConf.devtool || 'source-map', // 'eval-source-map',
  module: { rules },
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        cache: true,
        parallel: true,
        uglifyOptions: {
          ecma: 5,
          compress: false,
          mangle: false,
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
  }
};

const webpackConfigProdDefaults: IWebpackConfig = {
  mode: 'production',
  cache: false,
  devtool: 'source-map',
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

const webpackConfigDefaults: IWebpackConfig =
  process.env.NODE_ENV === 'production' ?
    webpackConfigProdDefaults :
    webpackConfigDevDefaults;

const webpackItemsMap: IWebpackMapItem[] = appConf.webpackItemsMap || [defaultItemMap];

const webpackConfigs = webpackItemsMap
  .filter(mapItem => {
    return mapItem.disable !== true;
  })
  .map(mapItem => {
    const filename = mapItem.target || defaultItemMap.target;
    const name = path.parse(filename).name;
    const entry: string[] = [];
    if (mapItem.includePolyfills) {
      entry.push(require.resolve('./polyfills'));
    }
    entry.push(mapItem.entry || defaultItemMap.entry);
    return {
      ...webpackConfigDefaults,
      ...(mapItem.webpackConfig || {}),
      entry,
      output: {
        path: path.join(process.cwd(), appConf.distFolder, (appConf.modulePath || ''), '/scripts'),
        filename: filename,
        sourceMapFilename: `${name}/[name].js.map?v=[chunkhash:8]&e=.js.map`,
        chunkFilename: `${name}/[name].chunk.js?v=[chunkhash:8]&e=.chunk.js`,
        publicPath: `${publishPath}/scripts/`,
        ...((mapItem.webpackConfig || {}).output || {})
      }
    } as IWebpackConfig;
  });

module.exports = webpackConfigs;
