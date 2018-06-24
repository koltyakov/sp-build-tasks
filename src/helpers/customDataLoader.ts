import { ISPBuildSettings, IGulpConfigs } from '../interfaces';

export const customDataLoader = (
  cb: (
    settings: ISPBuildSettings,
    gulpConfigs: IGulpConfigs
  ) => Promise<any>
) => cb;
