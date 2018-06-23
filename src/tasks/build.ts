import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as webpack from 'webpack';
import { Gulp } from 'gulp';

import { getConfigs } from './config';
import Build from '../utils/build';
import { walkFolders } from '../utils/misc';
import { detectProdMode } from '../utils/env';
import { processStepMessage } from '../utils/log';

import { ISPBuildSettings, IGulpConfigs, IAssetMap } from '../interfaces';

declare var global: any;

export const getBuildInstance = (settings: IGulpConfigs): Build => {
  global.build = global.build || new Build({
    dist: settings.appConfig.distFolder
  });
  return global.build;
};

export const buildTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('build', cb => {
    detectProdMode();
    (async () => {
      processStepMessage('Build: Copy Assets');
      await buildCopyAssetsTask(settings);
      processStepMessage('Build: CEWPs');
      await buildWebpartsTask(settings);
      processStepMessage('Build: Masterpages');
      await buildMasterpagesTask(settings);
      processStepMessage('Build: Layouts');
      await buildLayoutsTask(settings);
      processStepMessage('Build: Custom CSS');
      await buildCustomCssTask(settings);
      processStepMessage('Build: CSS Libraries');
      await buildCssLibsTask(settings);
      processStepMessage('Build: JavaScript DLLs');
      await buildJsLibsTask(settings);
      processStepMessage('Build: Webpack');
      await buildWebpackTask();
    })()
      .then(_ => cb())
      .catch(cb);
  });

  gulp.task('build:js-libs', cb => {
    processStepMessage('Build: JavaScript DLLs');
    buildJsLibsTask(settings).then(_ => cb()).catch(cb);
  });

  gulp.task('build:webpack', cb => {
    processStepMessage('Build: Webpack');
    detectProdMode();
    buildWebpackTask().then(_ => cb()).catch(cb);
  });

  gulp.task('build:css-libs', cb => {
    processStepMessage('Build: CSS Libraries');
    buildCssLibsTask(settings).then(_ => cb()).catch(cb);
  });

  gulp.task('build:css-custom', cb => {
    processStepMessage('Build: Custom CSS');
    buildCustomCssTask(settings).then(_ => cb()).catch(cb);
  });

  gulp.task('build:copy-assets', cb => {
    processStepMessage('Build: Copy Assets');
    buildCopyAssetsTask(settings).then(_ => cb()).catch(cb);
  });

  gulp.task('build:masterpage', cb => {
    processStepMessage('Build: Masterpages');
    buildMasterpagesTask(settings).then(_ => cb()).catch(cb);
  });

  gulp.task('build:layouts', cb => {
    processStepMessage('Build: Layouts');
    buildLayoutsTask(settings).then(_ => cb()).catch(cb);
  });

  gulp.task('build:webparts', cb => {
    processStepMessage('Build: CEWPs');
    buildWebpartsTask(settings).then(_ => cb()).catch(cb);
  });

};

const buildJsLibsTask = async (settings: ISPBuildSettings): Promise<void> => {
  const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
  const build = getBuildInstance(configs);

  const filesArr = configs.appConfig.bundleJSLibsFiles;
  const distPath = configs.appConfig.distFolder + '/scripts/vendor.js';
  const content = build.concatFilesContent({ filesArr });
  content && build.minifyJsContent({ content, distPath });

  return;
};

const buildWebpackTask = async (): Promise<void> => {
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
};

const buildCssLibsTask = async (settings: ISPBuildSettings): Promise<void> => {
  const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
  const build = getBuildInstance(configs);

  const filesArr = configs.appConfig.bundleCSSLibsFiles;
  const distPath = configs.appConfig.distFolder + '/styles/vendor.css';
  const content = build.concatFilesContent({ filesArr });
  if (content) {
    build.minifyCssContent({ content, distPath });
  }

  return;
};

const buildCustomCssTask = async (settings: ISPBuildSettings): Promise<void> => {
  const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
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
      const result = build.buildCustomCssFromScss({ file: srcPath, sourceMap: sourceMapFile, sourceMapContents: true });
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
};

const buildCopyAssetsTask = async (settings: ISPBuildSettings): Promise<void> => {
  const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
  const build = getBuildInstance(configs);

  (configs.appConfig.copyAssetsMap || []).forEach(assets => {
    build.copyAssets({ srcArrayOrPath: assets.src, dist: assets.dist });
  });

  return;
};

const mapProjectData = (configs: IGulpConfigs) => {
  const serverPath: string = configs.privateConf.siteUrl.replace('://', '__').split('/')[0].replace('__', '://');
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

const buildMasterpagesTask = async (settings: ISPBuildSettings): Promise<void> => {
  const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
  const build = getBuildInstance(configs);

  const data = mapProjectData(configs);
  const source = `./src/masterpage/${configs.appConfig.masterpageCodeName}.${configs.appConfig.platformVersion || '___'}.hbs`.replace('.___.', '.');
  const target = `${configs.appConfig.distFolder}/masterpage/${configs.appConfig.masterpageCodeName}.master`;

  if (fs.existsSync(source)) {
    await build.compileHbsTemplate({ source, target, data });
  }

  return;
};

const buildLayoutsTask = async (settings: ISPBuildSettings): Promise<void> => {
  const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
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
};

const buildWebpartsTask = async (settings: ISPBuildSettings): Promise<void> => {
  const configs: IGulpConfigs = global.gulpConfigs || await getConfigs(settings);
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
};
