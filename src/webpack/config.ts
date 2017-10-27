import * as path from 'path';
import * as webpack from 'webpack';

import { IWebpackMapItem, IWebpackConfig } from '../interfaces';

const config = require(path.join(process.cwd(), 'config/app.json'));

const defaultItemMap: IWebpackMapItem = {
    entry: './src/scripts/index.ts',
    target: 'app.js'
};

let webpackConfigDefaults: IWebpackConfig = {
    cache: true,
    devtool: 'source-map',
    module: {
        rules: [{
            test: /\.ts(x?)$/,
            exclude: /(node_modules|bower_components)/,
            use: [ 'awesome-typescript-loader' ]
        }]
    },
    plugins: [
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    }
};

let webpackItemsMap: IWebpackMapItem[] = config.webpackItemsMap || [defaultItemMap];

module.exports = webpackItemsMap.map(mapItem => {
    return {
        ...webpackConfigDefaults,
        ...(config.webpackConfig || {}),
        ...(mapItem.webpackConfig || {}),
        entry: {
            index: mapItem.entry || defaultItemMap.entry
        },
        output: {
            path: path.join(process.cwd(), config.distFolder, (config.modulePath || ''), '/scripts'),
            filename: mapItem.target || defaultItemMap.target
        }
    };
});
