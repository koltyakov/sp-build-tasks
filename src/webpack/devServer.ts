import * as path from 'path';
import RestProxy, { IProxySettings } from 'sp-rest-proxy/dist/RestProxy';
import { IAppConfig, IPrivateConfig } from '../interfaces';
import WebpackDevServer from 'webpack-dev-server';

export const getDevServerOpts = (appConf: IAppConfig, privateConf: IPrivateConfig, publishPath: string): WebpackDevServer.Configuration => {
  // Webpack dev server options
  const devServerPort = parseInt(process.env.SPBUILD_WEBPACK_PORT || '9090', 10);
  const devServerOptions: WebpackDevServer.Configuration = {
    static: { directory: path.join(process.cwd(), appConf.distFolder) },
    // hot: true, // causes conflicts with multiple assets loading the same map files
    hot: false,
    port: devServerPort,
    onBeforeSetupMiddleware: ({ app }) => {
      if (!app) return;

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
