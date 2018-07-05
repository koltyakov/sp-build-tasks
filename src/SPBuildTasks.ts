import { ISPBuildSettings } from './interfaces';
import * as loadGulpPlugins from 'gulp-load-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { Gulp } from 'gulp';

import { configTasks } from './tasks/config';
import { syncTasks } from './tasks/sync';
import { deployTasks } from './tasks/deploy';
import { buildTasks } from './tasks/build';
import { watchTasks } from './tasks/watch';
import { cleanTasks } from './tasks/clean';
import { analyzeTasks } from './tasks/analyze';
import { featuresTasks } from './tasks/features';

export class SPBuildTasks {

  private gulp: Gulp;
  private settings: ISPBuildSettings;

  constructor (gulp: Gulp, settings: ISPBuildSettings = {}) {
    this.settings = {
      ...settings,
      appConfig: settings.appConfig || './config/app.json',
      privateConf: settings.privateConf || './config/private.json',
      taskPath: settings.taskPath || './build/tasks'
    };
    this.gulp = gulp;
    this.initDotEnv();
    this.initGulpTasks();
  }

  private initDotEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, `PRIVATE_JSON=./config/private.json\nAPP_JSON=./config/app.json`, { encoding: 'utf-8' });
    }
  }

  private initGulpTasks() {
    const plugins = this.loadGulpPlugins();
    this.loadSPBuildGulpPlugins(plugins);
    this.loadCustomGulpTasks(this.settings.taskPath, plugins, this.settings);
  }

  private loadSPBuildGulpPlugins(plugins?: IGulpPlugins) {
    if (typeof plugins === 'undefined') {
      plugins = this.loadGulpPlugins();
    }

    configTasks(this.gulp, plugins, this.settings);
    syncTasks(this.gulp, plugins, this.settings);
    deployTasks(this.gulp, plugins, this.settings);
    buildTasks(this.gulp, plugins, this.settings);
    watchTasks(this.gulp, plugins, this.settings);
    cleanTasks(this.gulp, plugins, this.settings);
    analyzeTasks(this.gulp, plugins, this.settings);
    featuresTasks(this.gulp, plugins, this.settings);
  }

  private loadCustomGulpTasks(taskPath: string, plugins?: IGulpPlugins, settings?: ISPBuildSettings) {
    if (fs.existsSync(taskPath)) {
      const taskList = fs.readdirSync(taskPath);
      if (typeof plugins === 'undefined') {
        plugins = this.loadGulpPlugins();
      }
      taskList.forEach((taskFile) => {
        if (taskFile !== 'customDataLoader.js') {
          const task = require(path.resolve(path.join(taskPath, taskFile)));
          if (task && typeof task === 'function') {
            task(this.gulp, plugins, settings);
          }
        }
      });
    }
  }

  private loadGulpPlugins(): IGulpPlugins {
    return loadGulpPlugins({
      pattern: [
        'gulp-*', 'gulp.*', 'del', 'through2'
      ],
      rename: {
        'through2': 'through'
      }
    });
  }

}

export { ISPBuildSettings, IAppConfig } from './interfaces';
