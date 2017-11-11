import * as fs from 'fs';
import * as path from 'path';

import { IBuildSettings } from '../interfaces';

export default class Copy {

  private settings: IBuildSettings;

  constructor (settings: IBuildSettings = {}) {
    this.settings = {
      ...settings,
      src: settings.src || './src',
      dist: settings.dist || './dist',
      fileEncoding: settings.fileEncoding || 'utf-8'
    };
  }

  public copyFileOrFolderSync (source: string, target: string) {
    let skipFolder: boolean = source.endsWith('/*');
    if (skipFolder) {
      source = source.replace('/*', '');
    }
    if (fs.existsSync(source)) {
      if (fs.lstatSync(source).isDirectory()) {
        this.copyFolderRecursiveSync(source, target, skipFolder);
      } else {
        this.copyFileSync(source, target);
      }
    }
  }

  public copyFileSync (source: string, target: string) {
    let targetFile = target;
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
      }
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source), {
      encoding: this.settings.fileEncoding
    });
  }

  public copyFolderRecursiveSync (source: string, target: string, skipFolder: boolean = false) {
    let files = [];
    let targetFolder = skipFolder ? path.resolve(target) : path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder);
    }
    if (fs.lstatSync(source).isDirectory()) {
      files = fs.readdirSync(source);
      files.forEach((file) => {
        let curSource = path.join(source, file);
        if (fs.lstatSync(curSource).isDirectory()) {
          this.copyFolderRecursiveSync(curSource, targetFolder, false);
        } else {
          this.copyFileSync(curSource, targetFolder);
        }
      });
    }
  }

}
