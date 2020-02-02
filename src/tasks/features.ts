import { Gulp } from 'gulp';
import { Web, sp } from '@pnp/sp-commonjs';

import { setupPnp } from '../utils/pnpjs';
import { getConfigs } from './config';
import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

declare var global: any;

export const featuresTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('features:disable-mds', (cb) => {
    (async () => {

      const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
      const { siteUrl } = await setupPnp(configs);
      const web = typeof siteUrl !== 'undefined' ? Web(siteUrl) : sp.web;

      const mmdFeatureId = '87294c72-f260-42f3-a41b-981a2ffce37a';
      const feature = await web.features.getById(mmdFeatureId).get();
      if (feature.DefinitionId === mmdFeatureId) {
        await web.features.remove(mmdFeatureId);
        console.log('MDS has been deactivated');
      } else {
        console.log('MDS is already deactivated');
      }

    })().then(() => cb()).catch(cb);
  });

};
