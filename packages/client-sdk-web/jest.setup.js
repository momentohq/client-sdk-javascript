const util = require('util');

// ref: https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
// ref: https://github.com/jsdom/jsdom/issues/2524

// Generally speaking, we don't want to have these polyfills here. However, TextEncoder and 
// TextDecoder are supported by all modern broswers, the only "modern" browser that is it not supported
// in is IE 11, which is at EOL and retired June 2022 RIP. https://www.lambdatest.com/web-technologies/textencoder. 
Object.defineProperty(window, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder
})
Object.defineProperty(window, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder
})