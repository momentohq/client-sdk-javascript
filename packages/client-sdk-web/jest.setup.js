const XMLHttpRequest = require('xhr2');

Object.defineProperty(global, 'XMLHttpRequest', {
  configurable: false,
  enumerable: true,
  writable: false,
  value: XMLHttpRequest,
});
