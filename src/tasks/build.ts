import * as colors from 'colors';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as webpack from 'webpack';

import Build from '../utils/build';
import { walkFolders } from '../utils/misc';

import { Gulp } from '@types/gulp';
import { ISPBuildSettings, IGulpConfigs, IBuildSettings } from '../interfaces';

declare var global: any;

export const getBuildInstance = (settings: IGulpConfigs): Build => {
    global.build = global.build || new Build({

    });
    return global.build;
};

export const buildTasks = (gulp: Gulp, $: any, settings: ISPBuildSettings) => {

    gulp.task('build', [
        'build:webpack', 'build:css-custom', 'build:copy-assets',
        'build:js-libs', 'build:css-libs', 'build:masterpage',
        'build:layouts', 'build:webparts'
    ]);

    gulp.task('build:js-libs', [ 'config' ], (cb) => {
        let configs: IGulpConfigs = global.gulpConfigs;
        const build = getBuildInstance(configs);

        let filesArr = configs.appConfig.bundleJSLibsFiles;
        let distPath = configs.appConfig.distFolder + '/scripts/vendor.js';
        try {
            let concatedContent = build.concatFilesContent({
                filesArr: filesArr
            });
            let minifiedContent = build.minifyJsContent({
                content: concatedContent,
                distPath: distPath
            });
            cb();
        } catch (ex) {
            cb(ex);
        }
    });

    gulp.task('build:webpack', (cb) => {
        let webpackConfig: any;
        try {
            webpackConfig = require(path.join(process.cwd(), 'webpack.config.js'));
        } catch (ex) {
            webpackConfig = require(path.join(__dirname, '../webpack/config.js'));
        }
        webpack(webpackConfig, (err, stats) => {
            if (err) {
                cb(err);
            } else {
                console.log(stats.toString({
                    colors: true
                }));
                cb();
            }
        });
    });

    gulp.task('build:css-libs', [ 'config' ], (cb) => {
        let configs: IGulpConfigs = global.gulpConfigs;
        const build = getBuildInstance(configs);

        let filesArr = configs.appConfig.bundleCSSLibsFiles;
        let distPath = configs.appConfig.distFolder + '/styles/vendor.css';
        try {
            let concatedContent = build.concatFilesContent({
                filesArr: filesArr
            });
            let minifiedContent = build.minifyCssContent({
                content: concatedContent,
                distPath: distPath
            });
            cb();
        } catch (ex) {
            cb(ex);
        }
    });

    gulp.task('build:css-custom', [ 'config' ], (cb) => {
        let configs: IGulpConfigs = global.gulpConfigs;
        const build = getBuildInstance(configs);

        let srcPath = path.join(process.cwd(), 'src', (configs.appConfig.customStyles && configs.appConfig.customStyles.src as string) || 'styles/index.scss');
        let distPath = path.join(process.cwd(), configs.appConfig.distFolder, (configs.appConfig.customStyles && configs.appConfig.customStyles.dist) || 'styles/app.css');
        let sourceMapPath = distPath + '.map';
        let sourceMapFile = sourceMapPath.split('\\').pop();

        try {
            let result = build.buildCustomCssFromScss({ file: srcPath, sourceMap: sourceMapFile, sourceMapContents: true });
            mkdirp.sync(path.dirname(distPath));
            fs.writeFileSync(distPath, result.css.toString()
                .replace('/*# sourceMappingURL=../../../', '/*# sourceMappingURL='), 'utf-8');
            fs.writeFileSync(sourceMapPath, result.map.toString(), 'utf-8');
            cb();
        } catch (ex) {
            cb(ex);
        }
    });

    gulp.task('build:copy-assets', [ 'config' ], (cb) => {
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

    gulp.task('build:masterpage', [ 'config' ], (cb) => {
        let configs: IGulpConfigs = global.gulpConfigs;
        const build = getBuildInstance(configs);

        let packageData = require(path.join(process.cwd(), 'package.json'));
        let data = {
            publishPath: configs.privateConf.siteUrl + '/' + configs.appConfig.spFolder,
            masterpageName: configs.appConfig.masterpageCodeName,
            siteUrl: configs.privateConf.siteUrl,
            spRootFolder: configs.appConfig.spFolder,
            assetsVersion: packageData.version + '_' + (new Date()).getTime(),
            ...(configs.appConfig.masterpage || {})
        };
        let source = `./src/masterpage/${configs.appConfig.masterpageCodeName}.${configs.appConfig.platformVersion || '___'}.hbs`.replace('.___.', '.');
        let target = `${configs.appConfig.distFolder}/masterpage/${configs.appConfig.masterpageCodeName}.master`;

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
    });

    gulp.task('build:layouts', [ 'config' ], (cb) => {
        let configs: IGulpConfigs = global.gulpConfigs;
        const build = getBuildInstance(configs);

        let packageData = require(path.join(process.cwd(), 'package.json'));
        let data = {
            publishPath: configs.privateConf.siteUrl + '/' + configs.appConfig.spFolder,
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

    gulp.task('build:webparts', [ 'config' ], (cb) => {
        let configs: IGulpConfigs = global.gulpConfigs;
        const build = getBuildInstance(configs);

        let packageData = require(path.join(process.cwd(), 'package.json'));
        let data = {
            publishPath: configs.privateConf.siteUrl + '/' + configs.appConfig.spFolder,
            masterpageName: configs.appConfig.masterpageCodeName,
            spRootFolder: configs.appConfig.spFolder,
            assetsVersion: packageData.version + '_' + (new Date()).getTime(),
            ...(configs.appConfig.masterpage || {})
        };
        let source = './src/webparts';
        let target = configs.appConfig.distFolder + '/webparts';

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
