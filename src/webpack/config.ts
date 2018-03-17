import * as webpack from 'webpack';
import * as UglifyJSPlugin from 'uglifyjs-webpack-plugin';
import * as path from 'path';
import * as fs from 'fs';

import { IWebpackMapItem, IWebpackConfig as IWebpackConfigOld } from '../interfaces';

interface IWebpackConfig extends IWebpackConfigOld {
  mode: 'development' | 'production';
}

const config = require(path.join(process.cwd(), 'config/app.json'));

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

const webpackItemsMap: IWebpackMapItem[] = config.webpackItemsMap || [defaultItemMap];

module.exports = webpackItemsMap.map(mapItem => {
  return {
    ...webpackConfigDefaults,
    ...(config.webpackConfig || {}),
    ...(mapItem.webpackConfig || {}),
    entry: mapItem.entry || defaultItemMap.entry,
    output: {
      path: path.join(process.cwd(), config.distFolder, (config.modulePath || ''), '/scripts'),
      filename: mapItem.target || defaultItemMap.target,
      chunkFilename: '[name].chunk.js',
      ...((mapItem.webpackConfig || {}).output || {})
    }
  } as IWebpackConfig;
});
