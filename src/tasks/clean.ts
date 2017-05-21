import * as colors from 'colors';

import { Gulp } from '@types/gulp';
import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const cleanTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

    gulp.task('clean', () => {
        console.log(`\n${colors.red('===')} ${colors.green('Cleaning Distribution folder')} ${colors.yellow('===')}\n`);
        return $.del(['dist/**']);
    });

};
