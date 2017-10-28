import * as fs from 'fs';

export const walkFolders = (startFolder: string): string[] => {
  let results: string[] = [];
  let list: string[] = fs.readdirSync(startFolder);
  list.forEach((file) => {
    let itemPath = `${startFolder}/${file}`;
    let stat = fs.statSync(itemPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkFolders(itemPath));
    } else {
      results.push(itemPath);
    }
  });
  return results;
};
