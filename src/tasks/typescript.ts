import * as colors from 'colors';
import { Gulp } from 'gulp';

import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const typescriptTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  // const tsconfig = require('./tsconfig.json');

  // Compile TypeScript files
  gulp.task('tsc', ['config'], () => {
    console.log(`\n${colors.yellow('===')} ${colors.green('Simple TypeScript compilation')} ${colors.yellow('===')}\n`);

    let configs: IGulpConfigs = global.gulpConfigs;
    return gulp
      .src(['./src/**/*.ts'])
      .pipe($.tsc.createProject('tsconfig.json')())
      .js.pipe(gulp.dest(configs.appConfig.distFolder));
  });

  gulp.task('tslint', () => {
    let emitError = $.yargs.argv.emitError;
    return gulp.src(['src/**/*.ts'])
      .pipe($.tslint({
        configuration: './tslint.json',
        formatter: 'verbose'
      }))
      .pipe($.tslint.report({
        summarizeFailureOutput: true,
        emitError: emitError
      }));
  });

};
