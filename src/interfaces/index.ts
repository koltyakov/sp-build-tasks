import { IAuthOptions } from 'node-sp-auth';
import { Configuration, Options } from 'webpack';
import { ILRSettings } from 'sp-live-reload/dist/interfaces';

export interface IWebpackConfig extends Configuration {}

export interface IWebpackMapItem {
  entry: string;
  target: string;
  webpackConfig?: IWebpackConfig;
}

export interface IGulpConfigs {
  appConfig: IAppConfig;
  privateConf: IPrivateConfig;
  spSaveCoreOptions: any;
  watch: IWatchSettings;
  liveReload: ILRSettings;
}

export interface IWatchSettings {
  assets: string;
  base: string;
}

export interface IAppConfig {
  $schema?: string;
  spFolder: string;
  distFolder: string;
  deleteFiles?: boolean;
  masterpagePath?: string;
  masterpage?: any;
  masterpageCodeName?: string;
  platformVersion?: string;
  logoPath?: string;
  bundleJSLibsFiles?: string[];
  bundleCSSLibsFiles?: string[];
  copyAssetsMap?: IAssetMap[];
  customActions?: ICustomActionDefinition[];
  customStyles?: IAssetMap | IAssetMap[];
  modulePath?: string;
  customData?: any;
  webpackItemsMap?: Array<{ entry: string; target: string; }>;
  devtool?: Options.Devtool;
}

export interface ICustomActionDefinition {
  name?: string;
  scriptSrc: string;
  scope: 'web' | 'site';
  sequence: number;
}

export interface IAssetMap {
  src: string | string[];
  dist: string;
}

export interface IPrivateConfig {
  siteUrl: string;
  creds: IAuthOptions;
}

export interface ISPBuildSettings {
  privateConf?: string;
  appConfig?: string;
  taskPath?: string;
}

export interface IDeploySettings {
  siteUrl: string;
  creds: IAuthOptions;
  dist: string;
  spFolder: string;
}

export interface IApplyMasterpageToWeb {
  webUrl?: string;
  dist?: string;
  spFolder?: string;
  masterpagePath?: string;
}

export interface IApplyLogotypeToWeb {
  webUrl?: string;
  dist?: string;
  spFolder?: string;
  logoPath?: string;
}

export interface IKeyVal {
  [key: string]: any;
}

export interface IBuildSettings {
  src?: string;
  dist?: string;
  fileEncoding?: string;
}

export interface IFile {
  source: string;
  target: string;
}

export interface ICompileHbsTemplates {
  files: IFile[];
  data: IKeyVal;
}

export interface ICompileHbsTemplate {
  source: string;
  target: string;
  data: IKeyVal;
}

export interface ICopyAssets {
  srcArrayOrPath: string | string[];
  dist: string;
}

export interface IMinifyContent {
  content?: string;
  srcPath?: string;
  distPath: string;
}

export interface IConcatFilesContent {
  filesArr: string[];
  distPath?: string;
}

export interface IBuildCustomCssFromScss {
  file?: string;
  data?: string;
  outputStyle?: string | any;
  outFile?: string;
  sourceMap?: string;
  sourceMapContents?: boolean;
}
