import * as colors from 'colors';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as webpack from 'webpack';
import { Gulp } from 'gulp';

import Build from '../utils/build';
import { walkFolders } from '../utils/misc';

import { ISPBuildSettings, IGulpConfigs, IBuildSettings, IAssetMap } from '../interfaces';

declare var global: any;

export const getBuildInstance = (settings: IGulpConfigs): Build => {
  global.build = global.build || new Build({
    dist: settings.appConfig.distFolder
  });
  return global.build;
};

export const buildTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

  gulp.task('build:prod', ['env:prod', 'build']);
  gulp.task('build:dev', ['env:dev', 'build']);

  gulp.task('build', [
    'build:webpack', 'build:css-custom', 'build:copy-assets',
    'build:js-libs', 'build:css-libs', 'build:masterpage',
    'build:layouts', 'build:webparts'
  ]);

  gulp.task('build:js-libs', ['config'], (cb) => {
    let configs: IGulpConfigs = global.gulpConfigs;
    const build = getBuildInstance(configs);

    let filesArr = configs.appConfig.bundleJSLibsFiles;
    let distPath = configs.appConfig.distFolder + '/scripts/vendor.js';
    try {
      let concatedContent = build.concatFilesContent({
        filesArr: filesArr
      });
      if (concatedContent) {
        let minifiedContent = build.minifyJsContent({
          content: concatedContent,
          distPath: distPath
        });
      }
      cb();
    } catch (ex) {
      cb(ex);
    }
  });

  gulp.task('build:webpack', ['config'], (cb) => {
    let webpackConfigPath: string = path.join(process.cwd(), 'webpack.config.js');
    if (!fs.existsSync(webpackConfigPath)) {
      webpackConfigPath = path.join(__dirname, '../webpack/config.js');
    }
    let webpackConfig: any = require(webpackConfigPath);
    webpack(webpackConfig, (err, stats) => {
      if (err) {
        cb(err);
      } else {
        console.log(stats.toString({ colors: true }));
        cb();
      }
    });
  });

  gulp.task('build:css-libs', ['config'], (cb) => {
    let configs: IGulpConfigs = global.gulpConfigs;
    const build = getBuildInstance(configs);

    let filesArr = configs.appConfig.bundleCSSLibsFiles;
    let distPath = configs.appConfig.distFolder + '/styles/vendor.css';
    try {
      let concatedContent = build.concatFilesContent({
        filesArr: filesArr
      });
      if (concatedContent) {
        let minifiedContent = build.minifyCssContent({
          content: concatedContent,
          distPath: distPath
        });
      }
      cb();
    } catch (ex) {
      cb(ex);
    }
  });

  gulp.task('build:css-custom', ['config'], (cb) => {
    let configs: IGulpConfigs = global.gulpConfigs;
    const build = getBuildInstance(configs);

    let assetsArr: IAssetMap[] = [];
    let defaultMap: IAssetMap = {
      src: 'styles/index.scss',
      dist: 'styles/app.css'
    };
    if (!configs.appConfig.customStyles) {
      assetsArr.push({
        ...defaultMap
      });
    } else if (!Array.isArray(configs.appConfig.customStyles)) {
      assetsArr.push({
        src: (configs.appConfig.customStyles as IAssetMap).src || defaultMap.src,
        dist: (configs.appConfig.customStyles as IAssetMap).dist || defaultMap.dist
      });
    } else {
      assetsArr = configs.appConfig.customStyles;
    }

    try {
      for (let assets of assetsArr) {
        let srcPath = path.join(process.cwd(), 'src', (assets as any).src);
        if (fs.existsSync(srcPath)) {
          let distPath = path.join(process.cwd(), configs.appConfig.distFolder, (configs.appConfig.modulePath || ''), assets.dist);
          let sourceMapPath = distPath + '.map';
          let sourceMapFile = sourceMapPath.split('\\').pop();
          let result = build.buildCustomCssFromScss({ file: srcPath, sourceMap: sourceMapFile, sourceMapContents: true });
          mkdirp.sync(path.dirname(distPath));
          fs.writeFileSync(
            distPath,
            result.css.toString().replace('/*# sourceMappingURL=../../../', '/*# sourceMappingURL='),
            { encoding: 'utf-8' }
          );
          fs.writeFileSync(sourceMapPath, result.map.toString(), { encoding: 'utf-8' });
        }
      }
      cb();
    } catch (ex) {
      cb(ex);
    }
  });

  gulp.task('build:copy-assets', ['config'], (cb) => {
    let configs: IGulpConfigs = global.gulpConfigs;
    const build = getBuildInstance(configs);

    (configs.appConfig.copyAssetsMap || []).forEach((assets) => {
      build.copyAssets({
        srcArrayOrPath: assets.src,
        dist: assets.dist
      });
    });
    cb();
  });

  gulp.task('build:masterpage', ['config'], (cb) => {
    let configs: IGulpConfigs = global.gulpConfigs;
    const build = getBuildInstance(configs);

    let serverPath: string = configs.privateConf.siteUrl.replace('://', '__').split('/')[0].replace('__', '://');
    let publishPath: string = `${configs.privateConf.siteUrl}/${configs.appConfig.spFolder}`.replace(serverPath, '');

    let packageData = require(path.join(process.cwd(), 'package.json'));
    let data = {
      serverPath,
      publishPath,
      absolutePublishPath: `${serverPath}${publishPath}`,
      masterpageName: configs.appConfig.masterpageCodeName,
      siteUrl: configs.privateConf.siteUrl,
      spRootFolder: configs.appConfig.spFolder,
      assetsVersion: packageData.version + '_' + (new Date()).getTime(),
      ...(configs.appConfig.masterpage || {})
    };
    let source = `./src/masterpage/${configs.appConfig.masterpageCodeName}.${configs.appConfig.platformVersion || '___'}.hbs`.replace('.___.', '.');
    let target = `${configs.appConfig.distFolder}/masterpage/${configs.appConfig.masterpageCodeName}.master`;

    if (fs.existsSync(source)) {
      build.compileHbsTemplate({
        source: source,
        target: target,
        data: data
      })
        .then((res) => {
          cb();
        })
        .catch((err) => {
          cb(err);
        });
    } else {
      cb();
    }
  });

  gulp.task('build:layouts', ['config'], (cb) => {
    let configs: IGulpConfigs = global.gulpConfigs;
    const build = getBuildInstance(configs);

    let serverPath: string = configs.privateConf.siteUrl.replace('://', '__').split('/')[0].replace('__', '://');
    let publishPath: string = `${configs.privateConf.siteUrl}/${configs.appConfig.spFolder}`.replace(serverPath, '');

    let packageData = require(path.join(process.cwd(), 'package.json'));
    let data = {
      serverPath,
      publishPath,
      absolutePublishPath: `${serverPath}${publishPath}`,
      masterpageName: configs.appConfig.masterpageCodeName,
      spRootFolder: configs.appConfig.spFolder,
      assetsVersion: packageData.version + '_' + (new Date()).getTime(),
      ...(configs.appConfig.masterpage || {})
    };
    let source = './src/masterpage/layouts';
    let target = configs.appConfig.distFolder + '/masterpage/layouts';

    if (!fs.existsSync(source)) {
      return cb();
    }

    let files = fs.readdirSync(source)
      .map((file) => {
        let res = null;
        let fileName = path.join(source, file);
        let stat = fs.lstatSync(fileName);
        if (!stat.isDirectory()) {
          let fileParse = path.parse(fileName);
          if (fileParse.ext === '.hbs') {
            res = {
              source: fileName,
              target: path.join(target, fileParse.name + '.aspx')
            };
          }
        }
        return res;
      })
      .filter((obj) => {
        return obj !== null;
      });

    if (files.length > 0) {
      build.compileHbsTemplates({
        files: files,
        data: data
      })
        .then((res) => {
          cb();
        })
        .catch((err) => {
          cb(err);
        });
    } else {
      cb();
    }
  });

  gulp.task('build:webparts', ['config'], (cb) => {
    let configs: IGulpConfigs = global.gulpConfigs;
    const build = getBuildInstance(configs);

    let serverPath: string = configs.privateConf.siteUrl.replace('://', '__').split('/')[0].replace('__', '://');
    let publishPath: string = `${configs.privateConf.siteUrl}/${configs.appConfig.spFolder}`.replace(serverPath, '');

    if ((configs.appConfig.modulePath || '').length > 0) {
      publishPath += `/${configs.appConfig.modulePath}`.replace(/\/\//g, '/');
    }

    let packageData = require(path.join(process.cwd(), 'package.json'));
    let data = {
      serverPath,
      publishPath,
      absolutePublishPath: `${serverPath}${publishPath}`,
      masterpageName: configs.appConfig.masterpageCodeName,
      spRootFolder: configs.appConfig.spFolder,
      assetsVersion: packageData.version + '_' + (new Date()).getTime(),
      ...(configs.appConfig.masterpage || {})
    };
    let source = './src/webparts';
    let target = `${configs.appConfig.distFolder}/${(configs.appConfig.modulePath || '')}/webparts`.replace(/\/\//g, '/');

    if (!fs.existsSync(source)) {
      return cb();
    }

    let files = walkFolders(source)
      .map((file) => {
        let res = null;
        let fileParse = path.parse(file);
        let relativeFolder = fileParse.dir.replace(source, '');

        if (fileParse.ext === '.hbs') {
          res = {
            source: file,
            target: path.join(target, relativeFolder, fileParse.name + '.html')
          };
        }
        return res;
      })
      .filter((obj) => {
        return obj !== null;
      });

    if (files.length > 0) {
      build.compileHbsTemplates({
        files: files,
        data: data
      })
        .then((res) => {
          cb();
        })
        .catch((err) => {
          cb(err);
        });
    } else {
      cb();
    }
  });

};
