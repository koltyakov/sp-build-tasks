import * as fs from 'fs';
import * as path from 'path';
import { Gulp } from 'gulp';
import { spsave } from 'spsave';
import sppull from 'sppull';

import Files, { IFileProcessItem } from './../utils/files';

import { processStepMessage } from '../utils/log';
import { getConfigs } from './config';
import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const syncTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('pull', (cb) => {
    (async () => {
      processStepMessage('Fetching files from SharePoint');

      const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
      const options = {
        spRootFolder: configs.appConfig.spFolder,
        dlRootFolder: configs.appConfig.distFolder
      };

      await sppull.download(configs.privateConf, options);
    })().then(() => cb()).catch(cb);
  });

  gulp.task('push', (cb) => {
    const args = process.argv.slice(3);
    (async () => {
      const diff = args.filter((arg) => arg.toLowerCase() === '--diff').length > 0;

      processStepMessage(`Publishing assets to SharePoint${ diff ? ' (incremental mode)' : '' }`);

      const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);

      const localFiles = walkSync(configs.appConfig.distFolder, []);
      let remoteFiles: IFileProcessItem[] = [];

      if (diff) {
        // Incremental mode
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
        const remoteFile = remoteFiles.find((rf) => rf.relativePath === localFileRelPath);
        const fileContent = await getFileContent(localFilePath, configs);

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
          await new Promise((resolve, reject) => {
            spsave(configs.spSaveCoreOptions, configs.privateConf.creds, fileOptions)
              .then(resolve)
              .catch(reject);
          });
        }
      }

    })().then(() => cb()).catch(cb);
  });

};

const walkSync = (dir: string, filelist: string[]): string[] => {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      filelist = walkSync(filePath, filelist);
    } else {
      filelist.push(filePath);
    }
  });
  return filelist;
};

const readFileAsync = <T extends string | Buffer>(filePath: string, encoding: BufferEncoding | null): Promise<T> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding }, (err, data: T) => {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
};

const getFileContent = async (filePath: string, configs: IGulpConfigs): Promise<Buffer> => {
  // Replacement rules

  // Update .html's publish paths:
  //  - `href="(.*){{ spFolder }}` -> `href="{{ publishPath }}`
  //  - `src="(.*){{ spFolder }}` -> `src="{{ publishPath }}`
  //  - `<!-- (.*){{ spFolder }}` -> `<!-- {{ publishPath }}`
  if (filePath.toLowerCase().split('.').slice(-1)[0] === 'html') {
    const html = await readFileAsync<string>(filePath, 'utf8');

    const serverPath: string = configs.privateConf.siteUrl.split('/').splice(0, 3).join('/');
    const publishPath: string = `${configs.privateConf.siteUrl}/${configs.appConfig.spFolder}`
      .replace(serverPath, '')
      .replace(/\/\//g, '/');

    const tera: [ RegExp, string ][] = [
      [ new RegExp(`href="(.*)${configs.appConfig.spFolder}`, 'gi'), `href="${publishPath}` ],
      [ new RegExp(`src="(.*)${configs.appConfig.spFolder}`, 'gi'), `src="${publishPath}` ],
      [ new RegExp(`<!-- (.*)${configs.appConfig.spFolder}`, 'gi'), `<!-- ${publishPath}` ]
    ];

    const data = tera.reduce((d, t) => d.replace(t[0], t[1]), html);
    return Buffer.from(data, 'utf8');
  }

  // Return as is
  return readFileAsync(filePath, null);
};
