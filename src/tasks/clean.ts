import { Gulp } from 'gulp';

import { processStepMessage } from '../utils/log';
import { ISPBuildSettings } from '../interfaces';

export const cleanTasks = (gulp: Gulp, $: any, _settings: ISPBuildSettings) => {

  gulp.task('clean', () => {
    processStepMessage('Cleaning Distribution folder');
    return $.del(['dist/**', 'cache/**', 'tmp/**']);
  });

};
