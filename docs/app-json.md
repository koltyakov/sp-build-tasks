# ./config/app.json schema example

```json
{
  "spFolder": "_catalogs/masterpage/spf",
  "distFolder": "./dist",

  "masterpagePath": "masterpage/frankfurt.master",
  "logoPath": "images/logo-horizontal.png",
  "masterpageCodeName": "frankfurt",
  "platformVersion": "2016",
  "customStyles": {
    "src": "styles/frankfurt/frankfurt.scss",
    "dist": "styles/frankfurt.min.css"
  },
  "bundleJSLibsFiles": [
    "./bower_components/es6-promise/es6-promise.min.js",
    "./bower_components/whatwg-fetch/fetch.js",
    "./bower_components/json2/json2.js",
    "./bower_components/jquery/dist/jquery.min.js",
    "./bower_components/jquery-ui/jquery-ui.min.js",
    "./bower_components/jStorage/jstorage.min.js",
    "./bower_components/bootstrap/dist/js/bootstrap.min.js",
    "./node_modules/sp-pnp-js/dist/pnp.js",
    "./node_modules/axios/dist/axios.min.js",
    "./bower_components/perfect-scrollbar/js/perfect-scrollbar.jquery.min.js",
    "./bower_components/jquery-touchswipe/jquery.touchSwipe.min.js"
  ],
  "bundleCSSLibsFiles": [
    "./bower_components/font-awesome/css/font-awesome.min.css",
    "./bower_components/perfect-scrollbar/css/perfect-scrollbar.min.css",
    "bootstrap"
  ],
  "copyAssetsMap": [{
    "src": [
      "./bower_components/bootstrap/fonts",
      "./bower_components/font-awesome/fonts",
      "./src/images",
      "./src/fonts"
    ],
    "dist": "./dist"
  }],
  "masterpage": {
    "copyright": {
      "year": "2017",
      "title": "Contoso"
    }
  }
}
```