# sp-build-tasks

[![NPM](https://nodei.co/npm/sp-build-tasks.png?mini=true&downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/sp-build-tasks/)

[![npm version](https://badge.fury.io/js/sp-build-tasks.svg)](https://badge.fury.io/js/sp-build-tasks)
[![Downloads](https://img.shields.io/npm/dm/sp-build-tasks.svg)](https://www.npmjs.com/package/sp-build-tasks)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/sharepoint-node/Lobby)

> SharePoint front-end projects automation and tasks tool-belt

![banner](https://raw.githubusercontent.com/koltyakov/sp-build-tasks/master/docs/sp-build-tasks.png)

The library was designed for usage with [SharePoint Push-n-Pull](https://github.com/koltyakov/generator-sppp) Yeoman generator but can be used as a stand-alone package as well.

## Install

### Dependency

```bash
npm i sp-build-tasks --save-dev
```

### Integration to the code

```javascript
// gulpfile.js

const gulp = require('gulp');
require('dotenv').config();

new (require('sp-build-tasks').SPBuildTasks)(gulp, {
  privateConf: process.env.PRIVATE_JSON || './config/private.json',
  appConfig: process.env.APP_JSON || './config/app.json',
  taskPath: './tools/tasks'
});
```

#### Settings

Parameter | Description
----------|------------
`privateConf` | path to [credentials](https://github.com/koltyakov/node-sp-auth-config) config file
`appConfig` | path to application config file
`taskPath` | path to custom gulp tasks folder

### App config file

The app config file should be a JSON document with the following schema `sp-build-tasks/schema/v1/sppp.json`.

The schema represents the following interface:

```javascript
export interface IAppConfig {
  $schema?: string; // Path to `sp-build-tasks/schema/v1/sppp.json`
  spFolder: string; // SharePoint relative target folder (e.i. `_catalogs/masterpage/contoso`)
  distFolder: string; // Local distribution folder path
  deleteFiles?: boolean; // Delete remote files on local files unlink event
  masterpagePath?: string; // Path to masterpage .hbs in `./src` structure
  masterpage?: any; // masterpage's custom properties passed to hbs template
  masterpageCodeName?: string; // masterpage code name (used for renaming output file)
  platformVersion?: string; // Masterpage platform version (2016, 2013, etc.)
  logoPath?: string; // Path to logo image
  bundleJSLibsFiles?: string[]; // Paths to .js files to bundle together in a single vendor.js
  bundleCSSLibsFiles?: string[]; // Paths to .css files to bundle together in a single vendor.css
  copyAssetsMap?: IAssetMap[]; // Custom static files copy configuration
  customActions?: ICustomActionDefinition[];
  customStyles?: IAssetMap | IAssetMap[]; // Custom styles
  modulePath?: string; // Relative path for module inside dist structure, e.g. `modules/my-module`
  customData?: any; // Optional custom data object that can be used for feeding data to templates
  webpackItemsMap?: Array<{ entry: string; target: string; }>; // Scripts build configuration. Array or entry/target script pairs.
  devtool?: Options.Devtool; // Webpack `devtool` option for development mode, i.e. `eval`
}
```

#### Custom Gulp tasks

```javascript
// `./build/tasks/example.js`
module.exports = (gulp, $, settings) => {

  // gulp - Gulp object
  // $ - Gulp plugins dynamic loader
  // settings - ISPBuilderSettings object

  gulp.task('example', cb => {
    console.log('Example Gulp Task');
    cb();
  });

  // ...
};
```

or types supported version:

```javascript
//@ts-check

const { customTask } = require('sp-build-tasks');

module.exports = customTask((gulp, $, settings) => {

  gulp.task('example', cb => {
    console.log('Example Gulp Task');
    cb();
  });

});
```

## Gulp tasks

### Authentication config setup initiation

```bash
gulp config
```

Populates `./config/private.json` with credentials options.

### Watch and live development

#### Watch

```bash
gulp watch
```

Watch for changes in `./src` folder, compiles .ts, .hbs and .scss to `./dist`.
Watch for changes in `./dist` and uploads to target SharePoint folder.

#### Watch with SharePoint pages live reload

```bash
gulp live
```

Does the same as the `watch` task.
Emits files update to SharePoint live reload client which triggers live pages reload for:

- JavaScript's updates
- CSS's updates
- CEWPs updates
- Layouts updates
- Masterpage updates

### Syncronization

#### Publishing `./dist` to SharePoint

```bash
gulp push
```

Publishes all `./dist` folder content to SharePoint target folder.

#### Publishing in incremental mode

```bash
gulp push --diff
```

Uploads only files which size is different from those in SharePoint.

#### Fetching files from SharePoint

```bash
gulp pull
```

Downloads all files and folders from remote SharePoint target to `./dist` folder.

### Build front-end

```bash
gulp build
```

Compiles front-end to `./dist` folder.

#### Build options

##### Production build

```bash
gulp build --prod
```

Used with Webpack build.

##### Build subtasks

A specific subtasks can be provided as `gulp build` parameters:

Parameter | Description
----------|------------
--webpack | webpack'ing .ts to single app.js buldle
--css-custom | bundling custom css (from .scss)
--copy-assets | copying static content
--js-libs | bundling JavaScript libraries
--css-libs | bundling CSS libraries or custom .css
--masterpage | .hbs to .masterpage
--layouts | .hbs to .aspx layouts
--webparts | compiles .hbs CEWPs

```bash
gulp build --prod --webpack --webparts
```

Starts webparts and webpack tasks, also uses production build configs.

### Deployment

#### Live reload

```bash
gulp live-reload [--install]
```

Installs live reload client as ScriptLink custom action to SPWeb.

```bash
gulp live-reload --uninstall
```

Retracts live reload custom action client.

#### Masterpage

```bash
gulp masterpage [--install]
```

Applies custom masterpage and logo to SPWeb.

```bash
gulp masterpage --uninstall
```

Restores default (seattle.masterpage) masterpage.

#### Custom actions

```bash
gulp custom-actions [--install]
```

Provisions custom actions from `app.json` settings.

```bash
gulp custom-actions --uninstall
```

Removes custom actions based on project namespace prefix.
