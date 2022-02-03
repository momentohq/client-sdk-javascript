import {TextEncoder} from 'util';
import {GetResponse, CacheGetStatus} from '../../src';

describe('GetResponse.ts', () => {
  it('should correctly instantiate a GetResponse object', () => {
    const message = 'this is a message';
    const byteArray = new Uint8Array(12);
    const resp = new GetResponse(CacheGetStatus.Hit, message, byteArray);
    expect(resp.bytes()).toBe(byteArray);
    expect(resp.status).toEqual(CacheGetStatus.Hit);
  });
  it('text should be null on cache miss', () => {
    const resp = new GetResponse(CacheGetStatus.Miss, '', new Uint8Array());
    expect(resp.text()).toEqual(null);
  });
  it('should correctly convert string text from byte array', () => {
    const testString = 'this is a test';
    const textEncoder = new TextEncoder();
    const resp = new GetResponse(
      CacheGetStatus.Hit,
      '',
      textEncoder.encode(testString)
    );
    expect(resp.text()).toEqual(testString);
  });
});
