import * as path from 'path';
import * as fs from 'fs';
import { Gulp } from 'gulp';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import minimist from 'minimist';

import { processStepMessage } from '../utils/log';
import { getConfigs } from './config';
import { BuildTasks } from './build';
import { detectProdMode } from '../utils/env';
import { watchAssets } from './watch';

import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const serveTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  const buildTasks = new BuildTasks(settings);

  gulp.task('serve', () => {
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

  const args = minimist(process.argv.slice(3));

  let webpackConfigPath: string = path.join(process.cwd(), 'webpack.config.js');
  if (!fs.existsSync(webpackConfigPath)) {
    webpackConfigPath = path.join(__dirname, '../webpack/config.js');
  }
  let webpackConfig: any = require(webpackConfigPath);
  if (!Array.isArray(webpackConfig)) {
    webpackConfig = [webpackConfig];
  }
  const options: WebpackDevServer.Configuration = webpackConfig[webpackConfig.length - 1].devServer;
  const port = options.port || 9090;
  // if (typeof options.stats === 'undefined') {
  //   options.stats = 'errors-only';
  // }

  if (webpackConfig.length > 4) {
    console.log(
      `Warning: It's too name entry points in your Webpack configuration!\n` +
      `         Use "--webpack-targets=target1.js,target2.js" parameter to reduce a number of entry/targets.`
    );
  }

  const server = new WebpackDevServer(webpack(webpackConfig), options);

  server.listen(port, 'localhost', (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`Webpack Dev Server has been starter: http://localhost:${port}`);
  });

};
