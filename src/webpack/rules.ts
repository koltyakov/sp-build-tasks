import webpack = require('webpack');

export const getWebpackRules = (): webpack.RuleSetRule[] => {
  const rules: webpack.RuleSetRule[] = [
    {
      test: /\.ts(x?)$/,
      exclude: /(node_modules|dist)/,
      // use: [ 'awesome-typescript-loader' ]
      // { loader: 'awesome-typescript-loader', options: { sourceMap: true, useCache: true, useBabel: true, useTranspileModule: true } }
      use: [{
        loader : 'ts-loader',
        options: {
          transpileOnly: true,
          happyPackMode: true,
          experimentalWatchApi: true
        }
      }]
    },
    {
      test: /\.css$/,
      use: [
        { loader: 'style-loader' },
        { loader: 'css-loader', options: { sourceMap: true, url: false } }
      ]
    },
    {
      test: /\.scss$/,
      use: [
        { loader: 'style-loader' },
        { loader: 'css-loader', options: { sourceMap: true, url: false } },
        { loader: 'sass-loader' }
      ]
    }
  ];
  return rules;
};
