import {TextEncoder} from 'util';
import {CacheGet} from '../../../src';

describe('get-response.ts', () => {
  it('should correctly instantiate a GetResponse object', () => {
    const byteArray = new Uint8Array(12);
    const getResponse = new CacheGet.Hit(byteArray);
    expect(getResponse.valueUint8Array()).toBe(byteArray);
  });
  it('should correctly convert string text from byte array', () => {
    const testString = 'this is a test';
    const textEncoder = new TextEncoder();
    const getResponse = new CacheGet.Hit(textEncoder.encode(testString));
    expect(getResponse.valueString()).toEqual(testString);
  });
});
