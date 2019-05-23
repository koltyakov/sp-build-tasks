import * as mocha from 'mocha';
import { expect } from 'chai';
import * as path from 'path';

import { runScript, wrapPromiseTest } from './index';

const projFolder = path.join(__dirname, `./template`);
const cdPath = path.relative(process.cwd(), projFolder).replace(/\\/g, '/');

describe(`SharePoint Build Tasks tests`, () => {

  before('clean folder', function(done: Mocha.Done): void {
    this.timeout(30 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && rimraf ./dist ./tmp ./cache ./node_modules`), done);
  });

  it(`should restore project dependencies`, function(done: Mocha.Done): void {
    // slow task
    this.timeout(5 * 60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm install`), done);
  });

  it(`should build: copy assets`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build --copy-assets`), done);
    // ToDo: add assert criterias
  });

  it(`should build: webparts`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build --webparts`), done);
    // ToDo: add assert criterias
  });

  it(`should build: masterpage`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build --masterpage`), done);
    // ToDo: add assert criterias
  });

  it(`should build: layouts`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build --layouts`), done);
    // ToDo: add assert criterias
  });

  it(`should build: css custom`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build --css-custom`), done);
    // ToDo: add assert criterias
  });

  it(`should build: css libs`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build --css-libs`), done);
    // ToDo: add assert criterias
  });

  it(`should build: js libs`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build --js-libs`), done);
    // ToDo: add assert criterias
  });

  it(`should build: webpack`, function(done: Mocha.Done): void {
    // slow task
    this.timeout(10 * 60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build --webpack`), done);
    // ToDo: add assert criterias
  });

  it(`should clean temp files`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp clean`), done);
    // ToDo: add assert criterias
  });

  it(`should build: everything but not webpack`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build --no-webpack`), done);
    // ToDo: add assert criterias
  });

  it(`should build: everything`, function(done: Mocha.Done): void {
    // slow task
    this.timeout(5 * 60 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && npm run build`), done);
    // ToDo: add assert criterias
  });

  // ToDo: more test cases

  // publishing
  // custom tasks

});
