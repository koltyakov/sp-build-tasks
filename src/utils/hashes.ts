import { Web, SPRest, SPHttpClient } from '@pnp/sp';

import { IGulpConfigs } from '../interfaces';

interface IHashedValue {
  value?: string;
  needReplacement: boolean;
  get: () => Promise<string>;
}

interface IHash {
  [key: string]: IHashedValue;
}

interface IHashesProps {
  sp: SPRest;
  configs: IGulpConfigs;
}

export class Hashes {

  private hashes: IHash = {
    '~publishroot/': { get: this.getPublishRootUrl, needReplacement: true },
    '~site/': { get: this.getSiteUrl, needReplacement: false },
    '~sitecollection/': { get: this.getSiteCollectionUrl, needReplacement: false },
    '~hubsite/': { get: this.getHubSiteUrl, needReplacement: true }
  };

  private sp: SPRest;
  private client: SPHttpClient;
  private configs: IGulpConfigs;

  public constructor(props: IHashesProps) {
    this.sp = props.sp;
    this.configs = props.configs;
    this.client = new SPHttpClient();
  }

  public isHashedUrl(uri: string): boolean {
    let str = uri.toLowerCase();
    return Object.keys(this.hashes)
      .filter(key => str.indexOf(key) !== -1).length > 0;
  }

  public async replaceHashedUrl(uri: string): Promise<string> {
    let str = uri.toLowerCase();
    const rules = Object.keys(this.hashes).filter(key => str.indexOf(key) !== -1);
    for (const key of rules) {
      const rule = this.hashes[key];
      if (rule.needReplacement) {
        if (typeof rule.value === 'undefined') {
          await rule.get()
          .then(res => {
            rule.value = res;
          })
          .catch(error => {
            console.log(error);
            rule.value = null;
          });
        }
        if (rule.value === null) {
          str = null;
        }
        if (str !== null) {
          str = str.replace(new RegExp(key, 'ig'), rule.value);
        }
      }
    }
    return str;
  }

  private async getHubSiteUrl(): Promise<string> {
    const { Url: siteAbsoluteUrl } = await this.sp.site.select('Url').get();
    const endpoint = `${siteAbsoluteUrl}/_api/web/hubsitedata(false)`;

    const siteHubData = await this.client.get(endpoint)
      .then(r => r.json())
      .then(data => {
        if (data.value === null) {
          return null;
        }
        return JSON.parse(data.value);
      });

    if (siteHubData) {
      const hubRelativeUrl = '/' + siteHubData.url.split('/').splice(3,100).join('/');
      return hubRelativeUrl;
    } else {
      return null;
    }
  }

  private async getSiteUrl(): Promise<string> {
    const { ServerRelativeUrl } = await this.sp.web.select('ServerRelativeUrl').get();
    return ServerRelativeUrl;
  }

  private async getSiteCollectionUrl(): Promise<string> {
    const { ServerRelativeUrl } = await this.sp.site.select('ServerRelativeUrl').get();
    return ServerRelativeUrl;
  }

  private async getPublishRootUrl(): Promise<string> {
    const publishRootUrl = '/' + (this.configs.privateConf.siteUrl + this.configs.appConfig.spFolder)
      .split('/').splice(3,100).join('/');
    return publishRootUrl;
  }

}