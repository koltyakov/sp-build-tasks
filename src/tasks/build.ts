import * as path from 'path';
import * as fs from 'fs';
import mkdirp from 'mkdirp';
import webpack from 'webpack';
import { Gulp } from 'gulp';
import Listr from 'listr';
import minimist from 'minimist';

import { getConfigs } from './config';
import Build from '../utils/build';
import { walkFolders } from '../utils/misc';
import { detectProdMode, compileEnvHashedString } from '../utils/env';
import { processStepMessage } from '../utils/log';

import { ISPBuildSettings, IGulpConfigs, IAssetMap, IFile } from '../interfaces';

declare var global: any;

export const buildTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  const bt = new BuildTasks(settings);

  gulp.task('build', (cb) => {
    const mode = detectProdMode();
    const args = process.argv.slice(3);
    (async () => {
      processStepMessage(`Build (mode: ${mode})`);
      if (!fs.existsSync(path.resolve(settings.privateConf || './config/private.json'))) {
        await getConfigs(settings, false);
      }
      const tasksInfo = [
        { key: '--copy-assets', title: 'Copy Assets', task: bt.buildCopyAssetsTask },
        { key: '--webparts', title: 'Build CEWPs', task: bt.buildWebpartsTask },
        { key: '--masterpage', title: 'Build Masterpages', task: bt.buildMasterpagesTask },
        { key: '--layouts', title: 'Build Layouts', task: bt.buildLayoutsTask },
        { key: '--css-custom', title: 'Build Custom CSS', task: bt.buildCustomCssTask },
        { key: '--css-libs', title: 'Build CSS Libraries', task: bt.buildCssLibsTask },
        { key: '--js-libs', title: 'Build JavaScript DLLs', task: bt.buildJsLibsTask },
        { key: '--webpack', title: 'Starting Webpack build', task: () => Promise.resolve() }
      ];
      let tasks = tasksInfo.filter((task) => args.indexOf(task.key) !== -1);
      tasks = tasks.length > 0 ? tasks : tasksInfo;
      await new Listr(tasks).run();
      if (args.indexOf('--webpack') !== -1 || tasksInfo.length === tasks.length) {
        if (args.indexOf('--no-webpack') === -1) {
          await bt.buildWebpackTask();
        }
      }
    })()
      .then(() => cb())
      .catch(cb);
  });

};

export const mapProjectData = (configs: IGulpConfigs) => {
  const serverPath: string = configs.privateConf.siteUrl.split('/').splice(0, 3).join('/');
  const publishPath: string = `${configs.privateConf.siteUrl}/${configs.appConfig.spFolder}`
    .replace(serverPath, '')
    .replace(/\/\//g, '/');

  const packageData = require(path.join(process.cwd(), 'package.json'));
  const data = {
    serverPath,
    publishPath,
    absolutePublishPath: `${serverPath}${publishPath}`,
    masterpageName: configs.appConfig.masterpageCodeName,
    siteUrl: configs.privateConf.siteUrl,
    spRootFolder: configs.appConfig.spFolder,
    assetsVersion: packageData.version + '_' + (new Date()).getTime(),
    ...(configs.appConfig.masterpage || {}),
    customData: {
      ...(configs.appConfig.customData || {})
    }
  };

  return data;
};

export const getBuildInstance = (settings: IGulpConfigs): Build => {
  global.build = global.build || new Build({ dist: settings.appConfig.distFolder, fileEncoding: 'utf-8' });
  return global.build;
};

export class BuildTasks {

  public constructor(private settings: ISPBuildSettings) {}

  public buildJsLibsTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);
    const filesArr = (typeof configs.appConfig.bundleJSLibsFiles !== 'undefined'
      ? configs.appConfig.bundleJSLibsFiles : []).map(compileEnvHashedString);
    const distPath = configs.appConfig.distFolder + '/scripts/vendor.js';
    const content = await build.concatFilesContent({ filesArr });
    if (content) {
      const res = build.minifyJsContent({ content, distPath });
      if (res.error) {
        throw new Error(res.error.message);
      }
    }
    return;
  }

  public buildWebpackTask = async (parallelism = 1): Promise<void> => {
    const args = minimist(process.argv.slice(3));
    let webpackConfigPath: string = path.join(process.cwd(), 'webpack.config.js');
    if (!fs.existsSync(webpackConfigPath)) {
      webpackConfigPath = path.join(__dirname, '../webpack/config.js');
    }
    const webpackConfig = require(webpackConfigPath);
    const webpackConfigs = Array.isArray(webpackConfig) ? webpackConfig : [ webpackConfig ];

    // if (args['webpack-parallelism']) {
    //   parallelism = parseInt(args['webpack-parallelism'], 10) || 1;
    // }

    console.log('');
    let queueIndex = 0;
    let confQueue: any[] = [];
    for (const conf of webpackConfigs) {
      confQueue = confQueue.concat(conf);
      queueIndex += 1;
      if (confQueue.length === parallelism || queueIndex === webpackConfigs.length) {
        const bundlingItems = confQueue.map((c) => {
          const entries = Array.isArray(c.entry) ? c.entry : [ c.entry ];
          if (c.name) {
            return `${c.name}`; // (${entries.join(', ')})`;
          }
          return `${entries.join(', ')}`;
        });
        if (bundlingItems.length === 1) {
          console.log(`Bundling: ${bundlingItems[0]}`);
        } else {
          console.log(`Bundling: \n${bundlingItems.map((b) => `  - ${b}`).join('\n')}`);
        }
        await new Promise<void>((resolve, reject) => {
          webpack(confQueue, (err, stats) => {
            if (err) {
              reject(err.message);
            }
            if (args['webpack-stats']) {
              console.log(stats?.toString({ colors: true }));
            } else {
              console.error(stats?.toString('errors-only'));
            }
            resolve();
          });
        });
        confQueue = [];
      }
    }

    return;
  }

  public buildCssLibsTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);
    const filesArr = (typeof configs.appConfig.bundleCSSLibsFiles !== 'undefined'
      ? configs.appConfig.bundleCSSLibsFiles : []).map(compileEnvHashedString);
    const distPath = configs.appConfig.distFolder + '/styles/vendor.css';
    const content = await build.concatFilesContent({ filesArr });
    if (content) {
      build.minifyCssContent({ content, distPath });
    }
    return;
  }

  public buildCustomCssTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);

    let assetsArr: IAssetMap[] = [];
    const defaultMap: IAssetMap = {
      src: 'styles/index.scss',
      dist: 'styles/app.css'
    };
    if (!configs.appConfig.customStyles) {
      assetsArr.push({ ...defaultMap });
    } else if (!Array.isArray(configs.appConfig.customStyles)) {
      assetsArr.push({
        src: configs.appConfig.customStyles.src || defaultMap.src,
        dist: configs.appConfig.customStyles.dist || defaultMap.dist
      });
    } else {
      assetsArr = configs.appConfig.customStyles;
    }
    for (const assets of assetsArr) {
      const srcPathString = compileEnvHashedString((assets as any).src);
      const srcPath = path.join(process.cwd(), 'src', srcPathString);
      if (fs.existsSync(srcPath)) {
        const distPath = path.join(process.cwd(), configs.appConfig.distFolder, (configs.appConfig.modulePath || ''), assets.dist);
        const sourceMapPath = distPath + '.map';
        const { name, ext } = path.parse(sourceMapPath);
        const sourceMapFile = `${name}${ext}`;
        const result = await build.buildCustomCssFromScss({ file: srcPath, sourceMap: sourceMapFile, sourceMapContents: true });
        mkdirp.sync(path.dirname(distPath));
        const re = new RegExp(`(sourceMappingURL=)(.*?)(${sourceMapFile})`, 'g');
        if (result) {
          fs.writeFileSync(
            distPath,
            result.css.toString().replace(re, '$1$3'),
            { encoding: 'utf-8' }
          );
        }
        if (result?.map) {
          fs.writeFileSync(sourceMapPath, result.map.toString(), { encoding: 'utf-8' });
        }
      }
    }

    return;
  }

  public buildCopyAssetsTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);
    const assetsToCopy = configs.appConfig.copyAssetsMap || [];

    for (const assets of assetsToCopy) {
      const srcArrayOrPath = (typeof assets.src === 'string' ? [ assets.src ] : assets.src).map(compileEnvHashedString);
      build.copyAssets({ srcArrayOrPath, dist: compileEnvHashedString(assets.dist) });
    }

    return;
  }

  public buildMasterpagesTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);

    const data = mapProjectData(configs);
    const source = `./src/masterpage/${configs.appConfig.masterpageCodeName}.${configs.appConfig.platformVersion || '___'}.hbs`.replace('.___.', '.');
    const target = `${configs.appConfig.distFolder}/masterpage/${configs.appConfig.masterpageCodeName}.master`;

    if (fs.existsSync(source)) {
      await build.compileHbsTemplate({ source, target, data });
    }

    return;
  }

  public buildLayoutsTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);

    const data = mapProjectData(configs);
    const source = './src/masterpage/layouts';
    const target = configs.appConfig.distFolder + '/masterpage/layouts';

    if (!fs.existsSync(source)) {
      return;
    }

    const files: IFile[] = this.mapHbsTemplates(fs.readdirSync(source), source, target, 'aspx');

    if (files.length > 0) {
      await build.compileHbsTemplates({ files, data });
    }

    return;
  }

  public buildWebpartsTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);

    const data = mapProjectData(configs);
    const source = './src/webparts';
    const target = `${configs.appConfig.distFolder}/${(configs.appConfig.modulePath || '')}/webparts`.replace(/\/\//g, '/');

    if (!fs.existsSync(source)) {
      return;
    }

    // const files: IFile[] = this.mapHbsTemplates(walkFolders(source), './', target, 'html');
    const webpartsFiles = walkFolders(source).map((f) => f.replace(`${source}/`, ''));
    const files: IFile[] = this.mapHbsTemplates(webpartsFiles, source, target, 'html');

    if (files.length > 0) {
      await build.compileHbsTemplates({ files, data });
    }

    return;
  }

  private mapHbsTemplates(files: string[], source: string, target: string, ext: string): IFile[] {
    return files
      .map((file) => [ path.join(source, file), file])
      .filter(([ filePath ]) => !fs.lstatSync(filePath).isDirectory())
      .filter(([ filePath ]) => path.parse(filePath).ext.toLowerCase() === '.hbs')
      .map(([ filePath, file ]) => {
        return {
          source: filePath,
          target: path.join(target, `${file.replace('.hbs', '')}.${ext}`)
        };
      });
  }

}
