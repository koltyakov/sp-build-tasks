import * as  Promise from 'bluebird';
import * as spRequest from 'sp-request';

import {
    IDeploySettings, IApplyMasterpageToWeb, IApplyLogotypeToWeb
} from '../interfaces';

export default class Deploy {

    private settings: IDeploySettings;

    constructor(settings: IDeploySettings) {
        this.settings = {
            ...settings
        };
    }

    public applyMasterpageToWeb(params: IApplyMasterpageToWeb = {}) {
        let { webUrl, dist, spFolder, masterpagePath } = params;

        dist = dist || this.settings.dist;
        webUrl = webUrl || this.settings.siteUrl;
        spFolder = spFolder || this.settings.spFolder || '';
        masterpagePath = masterpagePath || '';

        const request = spRequest.create(this.settings.creds);

        return new Promise((resolve, reject) => {
            if (spFolder.length === 0) {
                reject('Error: SharePoint root folder is not provided');
            }
            if (masterpagePath.length === 0) {
                reject('Error: SharePoint masterpage path is not provided');
            }
            request.requestDigest(webUrl)
                .then(digest => {
                    let methodUri = `${webUrl}/_api/web`;
                    let webRelativeUrl = `/${webUrl.replace('https://', '').replace('http://', '').split('/').splice(1, 100).join('/')}`;
                    let masterpageFullPath = `/${webRelativeUrl}/${spFolder}/${masterpagePath}`.replace(/\/\//g, '/');

                    request.post(methodUri, {
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
                    })
                        .then(response => {
                            resolve(masterpageFullPath);
                        });
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    public applyLogotypeToWeb(params: IApplyLogotypeToWeb = {}) {
        let { webUrl, dist, spFolder, logoPath } = params;

        dist = dist || this.settings.dist;
        webUrl = webUrl || this.settings.siteUrl;
        spFolder = spFolder || this.settings.spFolder || '';
        logoPath = logoPath || '';

        const request = spRequest.create(this.settings.creds);

        return new Promise((resolve, reject) => {
            if (spFolder.length === 0) {
                reject('Error: SharePoint root folder is not provided');
            }
            if (logoPath.length === 0) {
                reject('Error: SharePoint logotype path is not provided');
            }
            request.requestDigest(webUrl)
                .then(digest => {
                    let methodUri = `${webUrl}/_api/web`;
                    let webRelativeUrl = `/${webUrl.replace('https://', '').replace('http://', '').split('/').splice(1, 100).join('/')}`;
                    let logoFullPath = `/${webRelativeUrl}/${spFolder}/${logoPath}`.replace(/\/\//g, '/');
                    request.post(methodUri, {
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
                    })
                        .then(response => {
                            resolve(logoFullPath);
                        });
                })
                .catch(err => {
                    reject(err);
                });
        });

    }

}
