import * as path from 'path';
import * as webpack from 'webpack';

const config = require(path.join(process.cwd(), 'config/app.json'));

module.exports = {
    cache: true,
    entry: {
        index: './src/scripts/index.ts'
    },
    output: {
        path: path.join(process.cwd(), config.distFolder, '/scripts'),
        filename: 'app.js'
    },
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
