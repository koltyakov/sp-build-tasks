import { readFileSync } from 'fs';
import { ISPRequest, create as createRequest } from 'sp-request';
import { Delete } from 'sppurge';
import * as colors from 'colors';

import { IDeploySettings } from '../interfaces';
import { type } from 'os';

export interface IFolderProcessItem {
  path: string;
  processed?: boolean;
}

export interface IFileProcessItem {
  path: string;
  relativePath?: string;
  length?: number;
  processed?: boolean;
}

export const extractSourcemapPath = (filePath: string) => {

  const innerRegex = /[#@] sourceMappingURL=([^\s'"]*)$/;

  const regex = RegExp(
    '(?:' +
      '/\\*' +
      '(?:\\s*\r?\n(?://)?)?' +
      '(?:' + innerRegex.source + ')' +
      '\\s*' +
      '\\*/' +
      '|' +
      '//(?:' + innerRegex.source + ')' +
    ')' +
    '\\s*'
  );

  const code = readFileSync(filePath).toString();

  const match = code.match(regex);
  return (match ? match[1] || match[2] || '' : null);

};

export default class Files {

  private settings: IDeploySettings;
  private sppurge: Delete;
  private spr: ISPRequest;

  constructor (settings: IDeploySettings) {
    this.settings = {
      ...settings,
      dist: settings.dist || './dist'
    };
    this.sppurge = new Delete();
    this.spr = createRequest(this.settings.creds);
  }

  public getServerRelativeUrl = (): Promise<string> => {
    return new Promise(resolve => {
      if (typeof global['serverRelativeUrl'] !== 'undefined') {
        resolve(global['serverRelativeUrl']);
      } else {
        const requestUrl = `${this.settings.siteUrl}/_api/web?$select=ServerRelativeUrl`;
        this.spr.get(requestUrl, {
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          }
        }).then(webProps => {
          global['serverRelativeUrl'] = webProps.body.d.ServerRelativeUrl;
          resolve(webProps.body.d.ServerRelativeUrl);
        });
      }
    });
  }

  public getFiles = (foldersArr: IFolderProcessItem[] = [], filesArr: IFileProcessItem[] = []): Promise<IFileProcessItem[]> => {
    return this.getServerRelativeUrl().then(serverRelativeUrl => {
      if (foldersArr.length === 0) {
        foldersArr.push({
          path: `${serverRelativeUrl}/${this.settings.spFolder}`.replace(/\/\//g, '/'),
          processed: false
        });
      }
      if (foldersArr.filter(folder => !folder.processed).length === 0) {
        return filesArr;
      } else {
        const folder = foldersArr.find(folder => !folder.processed);
        if (typeof folder === 'undefined') {
          return [];
        }
        const requestUrl = `${this.settings.siteUrl}` +
          `/_api/web/getFolderByServerRelativeUrl('${folder.path}')?` +
            `$select=Files,Folders/ServerRelativeUrl,Folders/ItemCount&` +
            `$expand=Files,Folders`;
        return this.spr.get(requestUrl, {
          headers: {
            'Accept': 'application/json; odata=verbose',
            'Content-Type': 'application/json; odata=verbose'
          }
        }).then(content => {
          folder.processed = true;
          filesArr = filesArr.concat(content.body.d.Files.results.map(fileResp => {
            return {
              path: fileResp.ServerRelativeUrl,
              relativePath: fileResp.ServerRelativeUrl.replace(`${serverRelativeUrl}/${this.settings.spFolder}/`.replace(/\/\//g, '/'), ''),
              length: parseInt(fileResp.Length, 10)
            };
          }));
          foldersArr = foldersArr.concat(content.body.d.Folders.results.map(folderResp => {
            return {
              path: folderResp.ServerRelativeUrl,
              processed: folderResp.ItemCount === 0
            };
          }));
          return this.getFiles(foldersArr, filesArr);
        });
      }
    });
  }

  public deleteFile = (filePath: string): Promise<void> => {
    return this.sppurge.deleteFile({
      siteUrl: this.settings.siteUrl,
      creds: this.settings.creds
    }, filePath);
  }

  public deleteFilesQueue = async (filesQueue: { path: string; processed: boolean; }[]): Promise<void> => {
    if (filesQueue.filter(file => !file.processed).length === 0) {
      return;
    } else {
      const file = filesQueue.find(folder => !folder.processed);
      if (typeof file === 'undefined') {
        return;
      }
      console.log(`Deleting ${colors.red(file.path)}`);
      await this.deleteFile(file.path);
      file.processed = true;
      await this.deleteFilesQueue(filesQueue);
      return;
    }
  }

}
