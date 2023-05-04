/* Attention:
before merging this console branch back into main, we need to
fix how we are encoding/decoding base64 strings. The functions atob and btoa
are deprecated in the node environment, but Buffer does not exist in a browser. There
are a few ways we can handle this.

1. have some way to determine an isNode() boolean flag
2. pull these functions out into their respective sdks
3. maybe some 3rd party library can help? */

import {Buffer} from 'buffer/index';

export const decodeFromBase64 = (base64: string) => {
  return Buffer.from(base64, 'base64').toString('utf8');
};

export const encodeToBase64 = (str: string) => {
  return Buffer.from(str, 'utf-8').toString('base64');
};
