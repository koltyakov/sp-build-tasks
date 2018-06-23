import { sp } from '@pnp/sp';
import { PnpNode, IPnpNodeSettings } from 'sp-pnp-node';

import { ISPBuildSettings } from '../interfaces';

export const setupPnp = async (settings: ISPBuildSettings): Promise<IPnpNodeSettings> => {
  const config = await new PnpNode({
    config: {
      configPath: settings.privateConf
    }
  }).init();

  sp.setup({
    sp: {
      headers: {
        accept: 'application/json;odata=verbose'
      }
    }
  });

  return config;
};
