import * as colors from 'colors';
import { Gulp } from 'gulp';

import { ISPBuildSettings } from '../interfaces';

export const cleanTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('clean', _ => {
    console.log(`\n${colors.red('===')} ${colors.green('Cleaning Distribution folder')} ${colors.yellow('===')}\n`);
    return $.del(['dist/**', 'cache/**', 'tmp/**']);
  });

};
