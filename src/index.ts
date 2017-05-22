import { ISPBuildSettings } from './interfaces';
import * as loadGulpPlugins from 'gulp-load-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { Gulp } from '@types/gulp';

import { configTasks } from './tasks/config';
import { syncTasks } from './tasks/sync';
import { deployTasks } from './tasks/deploy';
import { buildTasks } from './tasks/build';
import { watchTasks } from './tasks/watch';
import { typescriptTasks } from './tasks/typescript';
import { cleanTasks } from './tasks/clean';

class SPBuildTasks {

    private gulp: Gulp;
    private settings: ISPBuildSettings;

    constructor(gulp: Gulp, settings: ISPBuildSettings = {}) {
        this.settings = {
            ...settings,
            appConfig: settings.appConfig || './config/app.json',
            privateConf: settings.privateConf || './config/private.json',
            taskPath: settings.taskPath || './build/tasks'
        };
        this.gulp = gulp;
        this.initGulpTasks();
    }

    private initGulpTasks() {
        let plugins = this.loadGulpPlugins();
        this.loadSPBuildGulpPlugins(plugins);
        this.loadCustomGulpTasks(this.settings.taskPath, plugins);
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
        typescriptTasks(this.gulp, plugins, this.settings);
        cleanTasks(this.gulp, plugins, this.settings);
    }

    private loadCustomGulpTasks(taskPath: string, plugins?: IGulpPlugins) {
        const taskList = fs.readdirSync(taskPath);
        if (typeof plugins === 'undefined') {
            plugins = this.loadGulpPlugins();
        }
        taskList.forEach((taskFile) => {
            let task = require(path.resolve(path.join(taskPath, taskFile)));
            task(this.gulp, plugins);
        });
    }

    private loadGulpPlugins(): IGulpPlugins {
        return loadGulpPlugins({
            pattern: [
                'gulp-*', 'gulp.*',
                'run-sequence', 'merge-stream',
                'yargs', 'del', 'through2'
            ],
            rename: {
                'gulp-typescript': 'tsc',
                'run-sequence': 'rns',
                'merge-stream': 'merge',
                'through2': 'through'
            }
        });
    }

}

module.exports = SPBuildTasks;
