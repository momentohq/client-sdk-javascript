import {CacheSetFetch} from '../../src';

const LOL_BYTE_ARRAY = Uint8Array.of(108, 111, 108);
const FOO_BYTE_ARRAY = Uint8Array.of(102, 111, 111);

describe('CacheSetFetch', () => {
  it('should convert bytes to strings correctly', () => {
    const hit = new CacheSetFetch.Hit([LOL_BYTE_ARRAY, FOO_BYTE_ARRAY]);
    expect(hit.valueSetString()).toEqual(new Set(['lol', 'foo']));
  });
  it('should display a correct string for toString()', () => {
    const hit = new CacheSetFetch.Hit(['foo'].map(v => Buffer.from(v)));
    expect(hit.toString()).toEqual('Hit: [foo]');
  });
  it('should truncate if needed for toString()', () => {
    const hit = new CacheSetFetch.Hit(
      [
        'foooooooooooooooooooooooooooooooooooo',
        'bar',
        '1',
        '2',
        '3',
        '4',
        '5',
      ].map(v => Buffer.from(v))
    );
    expect(hit.toString()).toEqual(
      'Hit: [fooooooooooooooooooooooooooooooo...,bar,1,2,3,...]'
    );
  });
});
