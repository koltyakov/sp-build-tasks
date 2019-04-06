import * as path from 'path';
import * as fs from 'fs';
import { Gulp } from 'gulp';
import * as webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server';

import { processStepMessage } from '../utils/log';
import { getConfigs } from './config';
import { BuildTasks } from './build';
import { detectProdMode } from '../utils/env';
import { watchAssets } from './watch';

import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const serveTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  const buildTasks = new BuildTasks(settings);

  gulp.task('serve', _cb => {
    processStepMessage('Starting Webpack Dev Server');
    detectProdMode();
    (async () => {
      const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);

      startWebpackDevServer();
      watchAssets(buildTasks, configs, $, true);
    })()
      .catch(console.warn);
  });

};

const startWebpackDevServer = () => {
  let webpackConfigPath: string = path.join(process.cwd(), 'webpack.config.js');
  if (!fs.existsSync(webpackConfigPath)) {
    webpackConfigPath = path.join(__dirname, '../webpack/config.js');
  }
  let webpackConfig: any = require(webpackConfigPath);
  if (!Array.isArray(webpackConfig)) {
    webpackConfig = [webpackConfig];
  }
  const options = webpackConfig[webpackConfig.length - 1].devServer;
  const port = options.port || 9090;

  const server = new WebpackDevServer(webpack(webpackConfig), options);
  server.listen(port, 'localhost', err => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`Webpack Dev Server has been starter: http://localhost:${port}`);
  });
};
