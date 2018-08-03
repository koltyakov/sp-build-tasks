'use strict';

declare const window;

/**
 * IE Issue:
 * "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x.
 *  Use `buffer` v4.x if you require old browser support."
 */
if (typeof Uint8ClampedArray === 'undefined') {
  // tslint:disable-next-line:no-any
  (window as any).Uint8ClampedArray = () => [];
}

import 'core-js/es6/array';
import 'es6-map/implement';
import 'es6-set/implement';
import 'es6-weak-map/implement';

if (!window.location.origin) {
  const { protocol, hostname } = window.location;
  const port = window.location.port ? `:${window.location.port}` : '';
  (window.location as { origin: string })
    .origin = `${protocol}//${hostname}${port}`;
}

// Promise polyfill
if (typeof Promise === 'undefined') {
  require('promise/lib/rejection-tracking').enable();
  window.Promise = require('promise/lib/es6-extensions.js');
}

// Fetch polyfill
import 'whatwg-fetch';
