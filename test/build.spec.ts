import * as mocha from 'mocha';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import { runScript, wrapPromiseTest } from './index';

const projFolder = path.join(__dirname, `./template`);
const cdPath = path.relative(process.cwd(), projFolder).replace(/\\/g, '/');

process.env.SPAUTH_ENV = 'production';

describe(`SharePoint Build Tasks tests`, () => {

  before('initiate project', function(done: Mocha.Done): void {
    this.timeout(30 * 1000);
    wrapPromiseTest(runScript(`cd ${cdPath} && rimraf ./dist ./tmp ./cache ./node_modules && rm package-lock.json`), done);
  });

  it(`should restore project dependencies`, function(done: Mocha.Done): void {
    this.timeout(5 * 60 * 1000); // slow task
    wrapPromiseTest(runScript(`cd ${cdPath} && npm install`), done);
  });

  it(`should build: copy assets`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/fonts'))).to.equal(true, 'dist/fonts was copied');
      expect(fs.existsSync(path.join(projFolder, 'dist/images/an_image.svg'))).to.equal(true, 'dist/images/an_image.svg was copied');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp build --copy-assets`), done, asserts);
  });

  it(`should build: webparts`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/webparts/example.cewp.html'))).to.equal(true, 'dist/webparts/example.cewp.html was created');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp build --webparts`), done, asserts);
  });

  it(`should build: masterpage`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/masterpage/a_masterpage.master'))).to.equal(true, 'dist/masterpage/a_masterpage.master was created');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp build --masterpage`), done, asserts);
  });

  it(`should build: layouts`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/masterpage/layouts/a_layout.aspx'))).to.equal(true, 'dist/masterpage/layouts/a_layout.aspx was created');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp build --layouts`), done, asserts);
  });

  it(`should build: css custom`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/styles/app.css'))).to.equal(true, 'dist/styles/app.css was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/styles/app.css.map'))).to.equal(true, 'dist/styles/app.css.map was created');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp build --css-custom`), done, asserts);
  });

  it(`should build: css libs`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/styles/vendor.css'))).to.equal(true, 'dist/styles/vendor.css was created');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp build --css-libs`), done, asserts);
  });

  it(`should build: js libs`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/scripts/vendor.js'))).to.equal(true, 'dist/scripts/vendor.js was created');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp build --js-libs`), done, asserts);
  });

  it(`should build: webpack`, function(done: Mocha.Done): void {
    this.timeout(10 * 60 * 1000); // slow task
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/scripts/app.js'))).to.equal(true, 'dist/scripts/app.js was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/scripts/polyfills.js'))).to.equal(true, 'dist/scripts/polyfills.js was created');
      expect(fs.statSync(path.join(projFolder, 'dist/scripts/app.js')).size).to.lessThan(100000, 'app.js bundle size is less than 100KB');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp build --webpack`), done, asserts);
  });

  it(`should clean temp files`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    const asserts = () => {
      // expect(fs.existsSync(path.join(projFolder, 'dist'))).to.equal(false, 'dist/* was deleted'); // somehow fails in Azure DevOps
      expect(fs.existsSync(path.join(projFolder, 'cache'))).to.equal(false, 'cache/* was deleted');
      expect(fs.existsSync(path.join(projFolder, 'tmp'))).to.equal(false, 'tmp/* was deleted');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp clean`), done, asserts);
  });

  it(`should build: everything but not webpack`, function(done: Mocha.Done): void {
    this.timeout(60 * 1000);
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/fonts'))).to.equal(true, 'dist/fonts was copied');
      expect(fs.existsSync(path.join(projFolder, 'dist/images/an_image.svg'))).to.equal(true, 'dist/images/an_image.svg was copied');
      expect(fs.existsSync(path.join(projFolder, 'dist/webparts/example.cewp.html'))).to.equal(true, 'dist/webparts/example.cewp.html was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/masterpage/a_masterpage.master'))).to.equal(true, 'dist/masterpage/a_masterpage.master was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/masterpage/layouts/a_layout.aspx'))).to.equal(true, 'dist/masterpage/layouts/a_layout.aspx was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/styles/app.css'))).to.equal(true, 'dist/styles/app.css was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/styles/app.css.map'))).to.equal(true, 'dist/styles/app.css.map was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/scripts/vendor.js'))).to.equal(true, 'dist/scripts/vendor.js was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/scripts/app.js'))).to.equal(false, 'dist/scripts/app.js was not build');
      expect(fs.existsSync(path.join(projFolder, 'dist/scripts/polyfills.js'))).to.equal(false, 'dist/scripts/polyfills.js was not build');
      done();
    };
    wrapPromiseTest(runScript(`cd ${cdPath} && gulp build --no-webpack`), done, asserts);
  });

  it(`should build: everything`, function(done: Mocha.Done): void {
    this.timeout(5 * 60 * 1000); // slow task
    const asserts = () => {
      expect(fs.existsSync(path.join(projFolder, 'dist/fonts'))).to.equal(true, 'dist/fonts was copied');
      expect(fs.existsSync(path.join(projFolder, 'dist/images/an_image.svg'))).to.equal(true, 'dist/images/an_image.svg was copied');
      expect(fs.existsSync(path.join(projFolder, 'dist/webparts/example.cewp.html'))).to.equal(true, 'dist/webparts/example.cewp.html was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/masterpage/a_masterpage.master'))).to.equal(true, 'dist/masterpage/a_masterpage.master was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/masterpage/layouts/a_layout.aspx'))).to.equal(true, 'dist/masterpage/layouts/a_layout.aspx was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/styles/app.css'))).to.equal(true, 'dist/styles/app.css was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/styles/app.css.map'))).to.equal(true, 'dist/styles/app.css.map was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/scripts/vendor.js'))).to.equal(true, 'dist/scripts/vendor.js was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/scripts/app.js'))).to.equal(true, 'dist/scripts/app.js was created');
      expect(fs.existsSync(path.join(projFolder, 'dist/scripts/polyfills.js'))).to.equal(true, 'dist/scripts/polyfills.js was created');
      expect(fs.statSync(path.join(projFolder, 'dist/scripts/app.js')).size).to.lessThan(100000, 'app.js bundle size is less than 100KB');
      done();
    };
    wrapPromiseTest(
      runScript(`cd ${cdPath} && gulp clean`) // first clean when build
        .then(() => runScript(`cd ${cdPath} && npm run build`)
    ), done, asserts);
  });

  // ToDo: more test cases

  // publishing
  // custom tasks

});
