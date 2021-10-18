import {Momento} from '../src';
import {InvalidArgumentError} from '../src/Errors';

const AUTH_TOKEN =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI';

describe('Momento.ts', () => {
  it('cannot create/get cache with invalid name', async () => {
    const invalidCacheNames = ['', '    '];
    const momento = new Momento(AUTH_TOKEN);
    for (const name of invalidCacheNames) {
      await expect(
        momento.createOrGetCache(name, {
          defaultTtl: 10,
        })
      ).rejects.toThrow(InvalidArgumentError);
      expect(() => momento.createCache(name)).toThrow(InvalidArgumentError);
      expect(() => momento.getCache(name, {defaultTtl: 10})).toThrow(
        InvalidArgumentError
      );
    }
  });
});
