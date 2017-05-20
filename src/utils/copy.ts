import * as fs from 'fs';
import * as path from 'path';

export default class Copy {

    public copyFileOrFolderSync(source: string, target: string) {
        if (fs.existsSync(source)) {
            if (fs.lstatSync(source).isDirectory()) {
                this.copyFolderRecursiveSync(source, target);
            } else {
                this.copyFileSync(source, target);
            }
        }
    }

    public copyFileSync(source: string, target: string) {
        let targetFile = target;
        if (fs.existsSync(target)) {
            if (fs.lstatSync(target).isDirectory()) {
                targetFile = path.join(target, path.basename(source));
            }
        }
        fs.writeFileSync(targetFile, fs.readFileSync(source));
    }

    public copyFolderRecursiveSync(source: string, target: string) {
        let files = [];
        let targetFolder = path.join(target, path.basename(source));
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }
        if (fs.lstatSync(source).isDirectory()) {
            files = fs.readdirSync(source);
            files.forEach((file) => {
                let curSource = path.join(source, file);
                if (fs.lstatSync(curSource).isDirectory()) {
                    this.copyFolderRecursiveSync(curSource, targetFolder);
                } else {
                    this.copyFileSync(curSource, targetFolder);
                }
            });
        }
    }

}
