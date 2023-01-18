import {CacheSetFetch} from '../src';

const LOL_BYTE_ARRAY = Uint8Array.of(108, 111, 108);
const FOO_BYTE_ARRAY = Uint8Array.of(102, 111, 111);

describe('CacheSetFetch', () => {
  it('should convert bytes to strings correctly', () => {
    const hit = new CacheSetFetch.Hit([LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]);
    expect(hit.valueSetString()).toEqual(new Set(['lol', 'foo']));
  });
});
