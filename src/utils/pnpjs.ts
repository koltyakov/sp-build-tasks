import { sp } from '@pnp/sp-commonjs';
import { PnpNode, IPnpNodeSettings } from 'sp-pnp-node';

import { IGulpConfigs } from '../interfaces';

export const setupPnp = async (configs: IGulpConfigs): Promise<IPnpNodeSettings> => {

  const { siteUrl, creds: authOptions } = configs.privateConf;
  const config = await new PnpNode({ siteUrl, authOptions }).init();

  sp.setup({
    sp: {
      headers: {
        Accept: 'application/json;odata=verbose'
      },
      baseUrl: siteUrl
    }
  });

  return config;

};
