import webpack = require('webpack');
import * as ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { TsconfigPathsPlugin as TsConfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';

import { getWebpackRules } from '../rules';
import { getDevServerOpts } from '../devServer';

import { IWebpackConfig, IAppConfig, IPrivateConfig } from '../../interfaces';

export const getWebpackConfigDefaults = (appConf: IAppConfig, privateConf: IPrivateConfig, publishPath: string): IWebpackConfig => {

  const rules: webpack.RuleSetRule[] = getWebpackRules();

  let devtool: webpack.Options.Devtool | undefined = (process.env.SPBUILD_WEBPACK_DEVTOOL || appConf.devtool) as any;
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
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        checkSyntacticErrors: true
      })
    ]
  };

};
