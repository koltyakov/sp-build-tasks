import * as path from 'path';
import RestProxy, { IProxySettings } from 'sp-rest-proxy/dist/RestProxy';
import { IAppConfig, IPrivateConfig } from '../interfaces';

export const getDevServerOpts = (appConf: IAppConfig, privateConf: IPrivateConfig, publishPath: string) => {
  // Webpack dev server options
  const devServerPort = parseInt(process.env.SPBUILD_WEBPACK_PORT || '9090', 10);
  const devServerOptions = {
    contentBase: path.join(process.cwd(), appConf.distFolder),
    watchContentBase: true,
    writeToDisk: true,
    hot: true,
    port: devServerPort,
    before: (app) => { // (app, server) => {
      // Register SP API Proxy
      const settings: IProxySettings = {
        port: devServerPort,
        authConfigSettings: {
          authOptions: { ...privateConf, ...privateConf.creds },
          saveConfigOnDisk: false
        },
        strictRelativeUrls: true
      };
      new RestProxy(settings, app).serveProxy();

      // Register static assets under the publish path route
      app.get(`${publishPath}/*`, (req: any, res: any, _next: any) => {
        const filePath = path.join(
          process.cwd(),
          appConf.distFolder,
          req.url.replace(publishPath, '').split('?')[0]
        );
        res.sendFile(filePath);
      });
    }
  };
  return devServerOptions;
};
