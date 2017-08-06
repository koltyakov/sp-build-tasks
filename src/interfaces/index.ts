import { IAuthOptions } from 'node-sp-auth';
import { Gulp } from 'gulp';

export interface IGulpConfigs {
    appConfig: IAppConfig;
    privateConf: IPrivateConfig;
    spSaveCoreOptions: any;
    watch: IWatchSettings;
    liveReload: any;
}

export interface IWatchSettings {
    assets: string;
    base: string;
}

export interface IAppConfig {
    spFolder: string;
    distFolder: string;
    masterpagePath?: string;
    masterpage?: any;
    masterpageCodeName?: string;
    platformVersion?: string;
    logoPath?: string;
    bundleJSLibsFiles?: string[];
    bundleCSSLibsFiles?: string[];
    copyAssetsMap?: IAssetMap[];
    customStyles?: IAssetMap | IAssetMap[];
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
    outputStyle?: string;
    outFile?: string;
    sourceMap?: string;
    sourceMapContents?: boolean;
}
