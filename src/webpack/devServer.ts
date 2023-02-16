import * as path from 'path';
import RestProxy, { IProxySettings } from 'sp-rest-proxy/dist/RestProxy';
import { IAppConfig, IPrivateConfig } from '../interfaces';
import WebpackDevServer from 'webpack-dev-server';

export const getDevServerOpts = (appConf: IAppConfig, privateConf: IPrivateConfig, publishPath: string): WebpackDevServer.Configuration => {
    // Webpack dev server options
  const devServerPort = parseInt(process.env.SPBUILD_WEBPACK_PORT || '9090', 10);
  const devServerOptions: WebpackDevServer.Configuration = {
    static: { directory: path.join(process.cwd(), appConf.distFolder) },
    hot: true,
    watchFiles: [
      path.join(process.cwd(), appConf.distFolder, '/webparts/**/*'),
      path.join(process.cwd(), appConf.distFolder, '/styles/**/*'),
      path.join(process.cwd(), appConf.distFolder, '/libs/**/*'),
      path.join(process.cwd(), appConf.distFolder, '/images/**/*'),
      path.join(process.cwd(), appConf.distFolder, '/fonts/**/*'),
    ],
    liveReload: true,
    allowedHosts: 'all',
    port: devServerPort,
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer.app) return middlewares;

      // Register SP API Proxy
      const settings: IProxySettings = {
        port: devServerPort,
        authConfigSettings: {
          authOptions: { ...privateConf, ...privateConf.creds },
          saveConfigOnDisk: false
        },
        strictRelativeUrls: true
      };
      new RestProxy(settings, devServer.app).serveProxy();

      // Register static assets under the publish path route
      devServer.app.get(`${publishPath}/*`, (req: any, res: any, _next: any) => {
        const filePath = path.join(
          process.cwd(),
          appConf.distFolder,
          req.url.replace(publishPath, '').split('?')[0]
        );
        res.sendFile(filePath);
      });

      return middlewares;
    }
  };
  return devServerOptions;
};
