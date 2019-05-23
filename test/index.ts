import * as mocha from 'mocha';
import { expect } from 'chai';
import { spawn } from 'child_process';

export const runScript = (script: string, headless = true): Promise<void> => {
  return new Promise((resolve, reject) => {
    const shellSyntaxCommand = `${script}\n`;

    const shell = !headless
      ? spawn('sh', ['-c', shellSyntaxCommand], { stdio: 'inherit' })
      : spawn('sh', ['-c', shellSyntaxCommand]);

    const errors: string[] = [];
    shell.stderr && shell.stderr.on('data', (data) => errors.push(data.toString()));

    shell.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(errors.join('\n')));
      }
    });
  });
};

export const wrapPromiseTest = <T>(testPromise: Promise<T>, done: Mocha.Done, callback?: (result: T) => void): void => {
  testPromise
    .then((result) => {
      if (callback) {
        callback(result);
      } else {
        done();
      }
    })
    .catch(done);
};
