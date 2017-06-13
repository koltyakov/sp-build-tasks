import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as uglifyJS from 'uglify-js';
import * as CleanCSS from 'clean-css';
import * as deasync from 'deasync';
import * as less from 'less';
import * as sass from 'node-sass';

import Copy from './copy';

import {
    IBuildSettings,
    ICompileHbsTemplates, ICompileHbsTemplate,
    ICopyAssets, IMinifyContent,
    IConcatFilesContent, IBuildCustomCssFromScss
} from '../interfaces';

export default class Build {

    private settings: IBuildSettings;
    private copy: Copy = new Copy();
    private EOL: string = '\n';

    constructor(settings: IBuildSettings = {}) {
        this.settings = {
            ...settings,
            src: settings.src || './src',
            dist: settings.dist || './dist',
            fileEncoding: settings.fileEncoding || 'utf-8'
        };
    }

    public buildBootstrap() {
        let bootstrapRoot = path.join(process.cwd(), '/node_modules/bootstrap/less');
        let bootstrapFiles = [
            // Core variables and mixins
            'variables',
            'mixins',

            // Reset and dependencies
            // "normalize", // Not-Compatible
            'print',
            'glyphicons',

            // Core CSS
            // "scaffolding", // Not-Compatible
            // "type", // Not-Compatible
            'code',
            'grid',
            'tables',
            'forms', // Fixes needed
            'buttons',

            // Components
            'component-animations',
            'dropdowns',
            'button-groups',
            'input-groups',
            'navs',
            'navbar',
            'breadcrumbs',
            'pagination',
            'pager',
            'labels',
            'badges',
            'jumbotron',
            'thumbnails',
            'alerts',
            'progress-bars',
            'media',
            'list-group',
            'panels',
            'responsive-embed',
            'wells',
            'close',

            // Components w/ JavaScript
            'modals',
            'tooltip',
            'popovers',
            'carousel',

            // Utility classes
            'utilities',
            'responsive-utilities',
            'theme'
        ];
        let bootstrapPaths = bootstrapFiles.map(fileName => {
            return path.join(bootstrapRoot, '/', fileName + '.less');
        });
        let content = this.concatFilesContent({ filesArr: bootstrapPaths });
        let compiledCss = '';

        let bootstrapIsReady = false;
        less.render(content, {
            filename: path.resolve(path.join(bootstrapRoot, '/_.less'))
        }, (err, output) => {
            if (err) {
                console.log('Less compilation error:', err.message);
            } else {
                compiledCss = output.css;
            }
            bootstrapIsReady = true;
        });
        deasync.loopWhile(() => !bootstrapIsReady);
        return compiledCss;
    }

    public buildCustomCssFromScss(params: IBuildCustomCssFromScss = {}) {
        let { file, data, outputStyle, outFile, sourceMap, sourceMapContents } = params;
        data = data || file ? fs.readFileSync(file, this.settings.fileEncoding).toString() : null;
        outputStyle = outputStyle || 'compressed';
        let result = { css: '', map: '' };
        // Files lock issue workaraund
        let renderIsReady = false;
        setTimeout(() => {
            result = sass.renderSync({ file, data, outputStyle, outFile, sourceMap, sourceMapContents });
            renderIsReady = true;
        }, 50);
        deasync.loopWhile(() => !renderIsReady);
        return result; // .css
    }

    public concatFilesContent(params: IConcatFilesContent) {
        let { filesArr, distPath } = params;
        let concatedContent = (filesArr || []).map(filePath => {
            let content = '';
            if (filePath === 'bootstrap') {
                content = this.buildBootstrap();
            } else {
                content = fs.readFileSync(filePath, this.settings.fileEncoding).toString();
            }
            return content;
        });
        if (distPath) {
            mkdirp.sync(path.dirname(distPath));
            fs.writeFileSync(distPath, concatedContent.join(this.EOL), this.settings.fileEncoding);
        }
        return concatedContent.join(this.EOL);
    }

    public minifyJsContent(params: IMinifyContent) {
        let { content, srcPath, distPath } = params;
        content = content || fs.readFileSync(srcPath, this.settings.fileEncoding);
        let minifiedContent = uglifyJS.minify(content, {
            fromString: true
        });
        if (distPath) {
            mkdirp.sync(path.dirname(distPath));
            fs.writeFileSync(distPath, minifiedContent.code, this.settings.fileEncoding);
        }
        return minifiedContent;
    }

    public minifyCssContent(params: IMinifyContent) {
        let { content, srcPath, distPath } = params;
        content = content || fs.readFileSync(srcPath, this.settings.fileEncoding);
        let minifiedContent = new CleanCSS({ level: { 1: { specialComments: 0 } } }).minify(content);
        if (distPath) {
            mkdirp.sync(path.dirname(distPath));
            fs.writeFileSync(distPath, minifiedContent.styles, this.settings.fileEncoding);
        }
        return minifiedContent;
    }

    public copyAssets(params: ICopyAssets) {
        let { srcArrayOrPath, dist } = params;
        mkdirp.sync(dist);
        if (Array.isArray(srcArrayOrPath)) {
            srcArrayOrPath.forEach(src => {
                this.copy.copyFileOrFolderSync(src, dist);
            });
        } else {
            this.copy.copyFileOrFolderSync(srcArrayOrPath, dist);
        }
    }

    public compileHbsTemplate(params: ICompileHbsTemplate) {
        let { source, target, data } = params;
        let src = path.normalize(this.settings.src);
        let dist = path.normalize(this.settings.dist);
        source = path.normalize(source);
        target = path.normalize(target);
        if (source.indexOf(src) !== 0) {
            source = path.join(src, source);
        }
        if (target.indexOf(dist) !== 0) {
            target = path.join(dist, target);
        }

        return new Promise((resolve, reject) => {
            fs.readFile(source, this.settings.fileEncoding, (err, sourceBody) => {
                if (err) {
                    reject(err);
                }
                let template = Handlebars.compile(sourceBody.toString());
                let targetBody = template(data);
                mkdirp.sync(path.dirname(target));
                // tslint:disable-next-line:no-shadowed-variable
                fs.writeFile(target, targetBody, this.settings.fileEncoding, (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve({ targetBody, targetPath: target });
                });
            });
        });
    }

    public compileHbsTemplates(params: ICompileHbsTemplates) {
        let { files, data } = params;
        let compilePromises = files.map(file => {
            return this.compileHbsTemplate({
                source: file.source,
                target: file.target,
                data
            });
        });
        return Promise.all(compilePromises);
    }

}
