# sp-build-tasks

[![NPM](https://nodei.co/npm/sp-build-tasks.png?mini=true&downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/sp-build-tasks/)

[![npm version](https://badge.fury.io/js/sp-build-tasks.svg)](https://badge.fury.io/js/sp-build-tasks)
[![Downloads](https://img.shields.io/npm/dm/sp-build-tasks.svg)](https://www.npmjs.com/package/sp-build-tasks)

> SharePoint front-end projects automation and tasks tool-belt

## Authentication config setup initiation

```bash
gulp config
```

Populates `./config/private.json` with credentials options.

## Watch and live development

### Watch

```bash
gulp watch
```

Watch for changes in `./src` folder, compiles .ts, .hbs and .scss to `./dist`.
Watch for changes in `./dist` and uploads to target SharePoint folder.

### Watch with SharePoint pages live reload

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

## Syncronization

### Publishing `./dist` to SharePoint

```bash
gulp push
```

Publishes all `./dist` folder content to SharePoint target folder.

### Fetching files from SharePOint

```bash
gulp pull
```

Downloads all files and folders from remote SharePoint target to `./dist` folder.

## Build front-end

```bash
gulp build
```

Compiles front-end to `./dist` folder.

- build
  - build:webpack - webpack'ing .ts to single app.js buldle
  - build:css-custom - bundling custom css (from .scss)
  - build:copy-assets - copying static content
  - build:js-libs - bundling JavaScript libraries
  - build:css-libs - bundling CSS libraries or custom .css
  - build:masterpage - .hbs to .masterpage
  - build:layouts - .hbs to .aspx layouts
  - build:webparts - compiles .hbs CEWPs

## Deployment

### Live reload

```bash
gulp reload:install
```

Installs live reload client as ScriptLink custom action to SPWeb.

```bash
gulp reload:retract
```

Retracts live reload custom action client.

### Masterpage

```bash
gulp masterpage:apply
```

Applies custom masterpage and logo to SPWeb.

```bash
gulp masterpage:restore
```

Restores default (seattle.masterpage) masterpage.

### Logotype

```bash
gulp logo:apply
```

Applies custom logo to SPWeb.