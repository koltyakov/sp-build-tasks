import { Gulp } from 'gulp';

import { ISPBuildSettings } from '../interfaces';

export const customTask = (
  cb: (
    gulp: Gulp,
    $: IGulpPlugins,
    settings: ISPBuildSettings
  ) => void
) => cb;
