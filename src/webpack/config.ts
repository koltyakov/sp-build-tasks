import * as path from 'path';
import * as webpack from 'webpack';
import * as UglifyJSPlugin from 'uglifyjs-webpack-plugin';

import { IWebpackMapItem, IWebpackConfig } from '../interfaces';

const config = require(path.join(process.cwd(), 'config/app.json'));

const defaultItemMap: IWebpackMapItem = {
  entry: './src/scripts/index.ts',
  target: 'app.js'
};

const webpackConfigDevDefaults: IWebpackConfig = {
  cache: true,
  devtool: 'eval-source-map', // source-map
  module: {
    rules: [{
      test: /\.ts(x?)$/,
      exclude: /(node_modules|bower_components|dist)/,
      use: ['awesome-typescript-loader']
    }]
  },
  plugins: [],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }
};

const webpackConfigProdDefaults: IWebpackConfig = {
  cache: true,
  devtool: 'cheap-module-source-map',
  module: {
    rules: [{
      test: /\.ts(x?)$/,
      exclude: /(node_modules|bower_components|dist)/,
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
      ...((mapItem.webpackConfig || {}).output || {})
    }
  } as IWebpackConfig;
});
