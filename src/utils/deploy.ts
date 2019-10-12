import { create as createRequest } from 'sp-request';

import {
  IDeploySettings, IApplyMasterpageToWeb, IApplyLogotypeToWeb
} from '../interfaces';

export default class Deploy {

  private settings: IDeploySettings;

  constructor (settings: IDeploySettings) {
    this.settings = {
      ...settings
    };
  }

  public applyMasterpageToWeb (params: IApplyMasterpageToWeb = {}) {
    // const dist = params.dist || this.settings.dist;
    const webUrl = params.webUrl || this.settings.siteUrl;
    const spFolder = params.spFolder || this.settings.spFolder || '';
    const masterpagePath = params.masterpagePath || '';

    const request = createRequest(this.settings.creds);

    return new Promise((resolve, reject) => {
      if (spFolder.length === 0) {
        reject('Error: SharePoint root folder is not provided');
      }
      if (masterpagePath.length === 0) {
        reject('Error: SharePoint masterpage path is not provided');
      }
      const methodUri = `${webUrl}/_api/web`;
      const webRelativeUrl = `/${webUrl.replace('https://', '').replace('http://', '').split('/').splice(1).join('/')}`;
      const masterpageFullPath = `${webRelativeUrl}/${spFolder}/${masterpagePath}`.replace(/\/\//g, '/');
      request.requestDigest(webUrl)
        .then((digest) => {
          return request.post(methodUri, {
            headers: {
              'X-RequestDigest': digest,
              'X-HTTP-Method': 'MERGE',
              'Accept': 'application/json; odata=verbose',
              'Content-Type': 'application/json; odata=verbose'
            },
            body: {
              '__metadata': { 'type': 'SP.Web' },
              'MasterUrl': masterpageFullPath,
              'CustomMasterUrl': masterpageFullPath
            }
          });
        })
        .then(() => {
          resolve(masterpageFullPath);
        })
        .catch(reject);
    });
  }

  public applyLogotypeToWeb (params: IApplyLogotypeToWeb = {}) {
    // const dist: string = params.dist || this.settings.dist;
    const webUrl: string = params.webUrl || this.settings.siteUrl;
    const spFolder: string = params.spFolder || this.settings.spFolder || '';
    const logoPath: string = params.logoPath || '';

    const request = createRequest(this.settings.creds);

    return new Promise((resolve, reject) => {
      if (spFolder.length === 0) {
        reject('Error: SharePoint root folder is not provided');
      }
      if (logoPath.length === 0) {
        reject('Error: SharePoint logotype path is not provided');
      }
      const methodUri = `${webUrl}/_api/web`;
      const webRelativeUrl = `/${webUrl.replace('https://', '').replace('http://', '').split('/').splice(1).join('/')}`;
      const logoFullPath = `${webRelativeUrl}/${spFolder}/${logoPath}`.replace(/\/\//g, '/');
      request.requestDigest(webUrl)
        .then((digest) => {
          return request.post(methodUri, {
            headers: {
              'X-RequestDigest': digest,
              'X-HTTP-Method': 'MERGE',
              'Accept': 'application/json; odata=verbose',
              'Content-Type': 'application/json; odata=verbose'
            },
            body: {
              '__metadata': { 'type': 'SP.Web' },
              'SiteLogoUrl': logoFullPath
            }
          });
        })
        .then(() => {
          resolve(logoFullPath);
        })
        .catch(reject);
    });

  }

}
