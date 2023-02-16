import webpack = require('webpack');
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { TsconfigPathsPlugin as TsConfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';

import { getWebpackRules } from '../rules';
import { getDevServerOpts } from '../devServer';

import { IWebpackConfig, IAppConfig, IPrivateConfig } from '../../interfaces';

export const getWebpackConfigDefaults = (appConf: IAppConfig, privateConf: IPrivateConfig, publishPath: string): IWebpackConfig => {

  const rules: webpack.RuleSetRule[] = getWebpackRules();

  let devtool: string | false | undefined = process.env.SPBUILD_WEBPACK_DEVTOOL || appConf.devtool;
  devtool = typeof devtool !== 'undefined' ? devtool : 'source-map';
  if (`${devtool}` === 'none' || `${devtool}` === '') {
    devtool = undefined;
  }

  return {
    mode: 'development',
    cache: true,
    devtool, // : appConf.devtool || 'source-map', // 'eval-source-map',
    devServer: getDevServerOpts(appConf, privateConf, publishPath),
    module: { rules },
    resolve: {
      extensions: [ '.ts', '.tsx', '.js', '.jsx' ],
      plugins: [ new TsConfigPathsPlugin() ]
    },
    target: 'web',
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        // checkSyntacticErrors: true
      })
    ]
  };

};
