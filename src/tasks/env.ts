import * as colors from 'colors';

import { Gulp } from 'gulp';
import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const envTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('env:prod', (cb) => {
    process.env.NODE_ENV = 'production';
  });

  gulp.task('env:dev', (cb) => {
    process.env.NODE_ENV = 'development';
  });

};
