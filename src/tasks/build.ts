import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as webpack from 'webpack';
import { Gulp } from 'gulp';
import * as Listr from 'listr';

import { getConfigs } from './config';
import Build from '../utils/build';
import { walkFolders } from '../utils/misc';
import { detectProdMode } from '../utils/env';
import { processStepMessage } from '../utils/log';

import { ISPBuildSettings, IGulpConfigs, IAssetMap } from '../interfaces';

declare var global: any;

export const buildTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  const buildTasks = new BuildTasks(settings);

  gulp.task('build', cb => {
    const mode = detectProdMode(process);
    const args = process.argv.splice(3);
    (async () => {
      processStepMessage(`Build (mode: ${mode})`);
      if (!fs.existsSync(path.resolve(this.settings.privateConf))) {
        await getConfigs(this.settings);
      }
      const tasksInfo = [
        { key: '--copy-assets', title: 'Copy Assets', task: buildTasks.buildCopyAssetsTask },
        { key: '--webparts', title: 'Build CEWPs', task: buildTasks.buildWebpartsTask },
        { key: '--masterpage', title: 'Build Masterpages', task: buildTasks.buildMasterpagesTask },
        { key: '--layouts', title: 'Build Layouts', task: buildTasks.buildLayoutsTask },
        { key: '--css-custom', title: 'Build Custom CSS', task: buildTasks.buildCustomCssTask },
        { key: '--css-libs', title: 'Build CSS Libraries', task: buildTasks.buildCssLibsTask },
        { key: '--js-libs', title: 'Build JavaScript DLLs', task: buildTasks.buildJsLibsTask },
        { key: '--webpack', title: 'Starting Webpack build', task: () => Promise.resolve() }
      ];
      let tasks = tasksInfo.filter(task => args.indexOf(task.key) !== -1);
      tasks = tasks.length > 0 ? tasks : tasksInfo;
      await new Listr(tasks).run();
      if (args.indexOf('--webpack') !== -1 || tasksInfo.length === tasks.length) {
        await buildTasks.buildWebpackTask();
      }
    })()
      .then(_ => cb())
      .catch(cb);
  });

};

export const mapProjectData = (configs: IGulpConfigs) => {
  const serverPath: string = configs.privateConf.siteUrl.split('/').splice(0, 3).join('/');
  const publishPath: string = `${configs.privateConf.siteUrl}/${configs.appConfig.spFolder}`.replace(serverPath, '');

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
  global.build = global.build || new Build({ dist: settings.appConfig.distFolder });
  return global.build;
};

export class BuildTasks {

  public constructor(private settings: ISPBuildSettings) {}

  public buildJsLibsTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);

    const filesArr = configs.appConfig.bundleJSLibsFiles;
    const distPath = configs.appConfig.distFolder + '/scripts/vendor.js';
    const content = await build.concatFilesContent({ filesArr });
    content && build.minifyJsContent({ content, distPath });

    return;
  }

  public buildWebpackTask = async (): Promise<void> => {
    let webpackConfigPath: string = path.join(process.cwd(), 'webpack.config.js');
    if (!fs.existsSync(webpackConfigPath)) {
      webpackConfigPath = path.join(__dirname, '../webpack/config.js');
    }
    const webpackConfig = require(webpackConfigPath);
    await new Promise((resolve, reject) => {
      webpack(webpackConfig, (err, stats) => {
        if (err) {
          reject(err.message);
        }
        console.log(stats.toString({ colors: true }));
        resolve();
      });
    });

    return;
  }

  public buildCssLibsTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);

    const filesArr = configs.appConfig.bundleCSSLibsFiles;
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
        src: (configs.appConfig.customStyles as IAssetMap).src || defaultMap.src,
        dist: (configs.appConfig.customStyles as IAssetMap).dist || defaultMap.dist
      });
    } else {
      assetsArr = configs.appConfig.customStyles;
    }
    for (const assets of assetsArr) {
      const srcPath = path.join(process.cwd(), 'src', (assets as any).src);
      if (fs.existsSync(srcPath)) {
        const distPath = path.join(process.cwd(), configs.appConfig.distFolder, (configs.appConfig.modulePath || ''), assets.dist);
        const sourceMapPath = distPath + '.map';
        const sourceMapFile = sourceMapPath.split('\\').pop();
        const result = await build.buildCustomCssFromScss({ file: srcPath, sourceMap: sourceMapFile, sourceMapContents: true });
        mkdirp.sync(path.dirname(distPath));
        fs.writeFileSync(
          distPath,
          result.css.toString().replace('/*# sourceMappingURL=../../../', '/*# sourceMappingURL='),
          { encoding: 'utf-8' }
        );
        fs.writeFileSync(sourceMapPath, result.map.toString(), { encoding: 'utf-8' });
      }
    }

    return;
  }

  public buildCopyAssetsTask = async (): Promise<void> => {
    const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(this.settings);
    const build = getBuildInstance(configs);
    const assetsToCopy = configs.appConfig.copyAssetsMap || [];

    for (const assets of assetsToCopy) {
      build.copyAssets({ srcArrayOrPath: assets.src, dist: assets.dist });
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

    const files = fs.readdirSync(source).map(file => {
      let res = null;
      const fileName = path.join(source, file);
      const stat = fs.lstatSync(fileName);
      if (!stat.isDirectory()) {
        const fileParse = path.parse(fileName);
        if (fileParse.ext === '.hbs') {
          res = {
            source: fileName,
            target: path.join(target, fileParse.name + '.aspx')
          };
        }
      }
      return res;
    }).filter(obj => obj !== null);

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

    const files = walkFolders(source).map(file => {
      let res = null;
      const fileParse = path.parse(file);
      const relativeFolder = fileParse.dir.replace(source, '');

      if (fileParse.ext === '.hbs') {
        res = {
          source: file,
          target: path.join(target, relativeFolder, fileParse.name + '.html')
        };
      }
      return res;
    }).filter(obj => obj !== null);

    if (files.length > 0) {
      await build.compileHbsTemplates({ files, data });
    }

    return;
  }
}
