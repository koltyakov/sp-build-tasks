import { Gulp } from 'gulp';
import { Web } from '@pnp/sp';

import { setupPnp } from '../utils/pnpjs';
import { ISPBuildSettings } from '../interfaces';

export const featuresTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('features:disable-mds', cb => {
    (async () => {

      const ctx = await setupPnp(settings);
      const web = new Web(ctx.siteUrl);

      const mmdFeatureId = '87294c72-f260-42f3-a41b-981a2ffce37a';
      const feature = await web.features.getById(mmdFeatureId).get();
      if (feature.DefinitionId === mmdFeatureId) {
        await web.features.remove(mmdFeatureId);
        console.log('MDS has been deactivated');
      } else {
        console.log('MDS is already deactivated');
      }

    })().then(_ => cb()).catch(cb);
  });

};
