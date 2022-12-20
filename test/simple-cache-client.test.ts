import {CreateCache, InvalidArgumentError, SimpleCacheClient} from '../src';

const AUTH_TOKEN =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI';

describe('SimpleCacheClient.ts', () => {
  it('cannot create/get cache with invalid name', async () => {
    const invalidCacheNames = ['', '    '];
    const momento = new SimpleCacheClient(AUTH_TOKEN, 100);
    for (const name of invalidCacheNames) {
      const createResponse = await momento.createCache(name);
      expect(createResponse).toBeInstanceOf(CreateCache.Error);
      if (createResponse instanceof CreateCache.Error) {
        expect(createResponse.innerException()).toBeInstanceOf(
          InvalidArgumentError
        );
      }
    }
  });
  it('cannot create a client with an invalid request timeout', () => {
    try {
      new SimpleCacheClient(AUTH_TOKEN, 100, {requestTimeoutMs: -1});
      fail(new Error('Expected InvalidArgumentError to be thrown!'));
    } catch (e) {
      if (!(e instanceof InvalidArgumentError)) {
        fail(new Error('Expected InvalidArgumentError to be thrown!'));
      }
    }
  });
});
