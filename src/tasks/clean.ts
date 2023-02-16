import { Gulp } from 'gulp';
import rimraf from 'rimraf';

import { processStepMessage } from '../utils/log';
import { ISPBuildSettings } from '../interfaces';

export const cleanTasks = (gulp: Gulp, $: any, _settings: ISPBuildSettings) => {

  gulp.task('clean', () => {
    processStepMessage('Cleaning Distribution folder');
    return rimraf(['dist/', 'cache/', 'tmp/']);
  });

};
