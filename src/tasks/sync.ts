import * as fs from 'fs';
import * as path from 'path';
import { Gulp } from 'gulp';
const sppull = require('sppull').sppull;
import { spsave } from 'spsave';

import Files, { IFileProcessItem } from './../utils/files';

import { processStepMessage } from '../utils/log';
import { getConfigs } from './config';
import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const syncTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('pull', cb => {
    (async () => {
      processStepMessage('Fetching files from SharePoint');

      const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
      const options = {
        spRootFolder: configs.appConfig.spFolder,
        dlRootFolder: configs.appConfig.distFolder
      };

      await sppull(configs.privateConf, options);
    })().then(_ => cb()).catch(cb);
  });

  gulp.task('push', cb => {
    const args = process.argv.slice(3);
    (async () => {
      const diff = args.filter(arg => arg.toLowerCase() === '--diff').length > 0;

      processStepMessage(`Publishing assets to SharePoint${ diff ? ' (incremental mode)' : '' }`);

      const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);

      const localFiles = walkSync(configs.appConfig.distFolder, []);
      let remoteFiles: IFileProcessItem[] = [];

      if (diff) {
        // Incrementall mode
        const utils = new Files({
          siteUrl: configs.privateConf.siteUrl,
          creds: configs.privateConf.creds,
          dist: configs.appConfig.distFolder,
          spFolder: configs.appConfig.spFolder
        });
        remoteFiles = await utils.getFiles();
      }

      for (const localFilePath of localFiles) {
        const localFileRelPath = path.relative(configs.appConfig.distFolder, localFilePath).replace(/\\/g, '/');
        const remoteFile = remoteFiles.find(rf => rf.relativePath === localFileRelPath);
        const fileContent = fs.readFileSync(localFilePath);

        const fileOptions = {
          folder: `${configs.appConfig.spFolder}/${
            path.dirname(path.relative(configs.appConfig.distFolder, localFilePath))
              .replace(/\\/g, '/')
          }`,
          fileName: path.basename(localFilePath),
          fileContent
        };

        let skipUpload = false;
        if (remoteFile) {
          if (fileContent.length === remoteFile.length) {
            skipUpload = true;
          }
        }

        if (!skipUpload) {
          await spsave(configs.spSaveCoreOptions, configs.privateConf.creds, fileOptions);
        }
      }

    })().then(_ => cb()).catch(cb);
  });

};

const walkSync = (dir: string, filelist: string[]): string[] => {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(file => {
    let filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      filelist = walkSync(filePath, filelist);
    } else {
      filelist.push(filePath);
    }
  });
  return filelist;
};
