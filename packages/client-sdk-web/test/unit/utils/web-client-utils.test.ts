import {
  Base64DecodedV1Token,
  encodeToBase64,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {CredentialProvider} from '@gomomento/sdk-core';
import {
  getWebCacheEndpoint,
  getWebControlEndpoint,
  getWebTokenEndpoint,
  getWebVectorEndpoint,
} from '../../../src/utils/web-client-utils';
import {describe, expect, it} from 'vitest';

// These tokens have valid syntax, but they don't actually have valid credentials.  Just used for unit testing.
const fakeTestLegacyToken =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJmb29Abm90LmEuZG9tYWluIiwiY3AiOiJjb250cm9sLXBsYW5lLWVuZHBvaW50Lm5vdC5hLmRvbWFpbiIsImMiOiJjYWNoZS1lbmRwb2ludC5ub3QuYS5kb21haW4ifQo.rtxfu4miBHQ1uptWJ2x3UiAwwJYcMeYIkkpXxUno_wIavg4h6YJStcbxk32NDBbmJkJS7mUw6MsvJNWaxfdPOw';
const fakeTestV1ApiKey =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NzgzMDU4MTIsImV4cCI6NDg2NTUxNTQxMiwiYXVkIjoiIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSJ9.8Iy8q84Lsr-D3YCo_HP4d-xjHdT8UCIuvAYcxhFMyz8';
const decodedV1Token: Base64DecodedV1Token = {
  api_key: fakeTestV1ApiKey,
  endpoint: 'test.momentohq.com',
};
const base64EncodedFakeV1AuthToken = encodeToBase64(
  JSON.stringify(decodedV1Token)
);

describe('getWeb*Endpoint', () => {
  it('adds "https://web." prefix to endpoints that were parsed from legacy tokens', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: fakeTestLegacyToken,
    });
    const webControlEndpoint = getWebControlEndpoint(credProvider);
    expect(webControlEndpoint).toEqual(
      'https://web.control-plane-endpoint.not.a.domain'
    );
  });
  it('adds "https://web." prefix to endpoints that were parsed from v1 tokens', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
    });
    const webControlEndpoint = getWebControlEndpoint(credProvider);
    expect(webControlEndpoint).toEqual(
      'https://web.control.test.momentohq.com'
    );
    const webCacheEndpoint = getWebCacheEndpoint(credProvider);
    expect(webCacheEndpoint).toEqual('https://web.cache.test.momentohq.com');
    const webTokenEndpoint = getWebTokenEndpoint(credProvider);
    expect(webTokenEndpoint).toEqual('https://web.token.test.momentohq.com');
    const webVectorEndpoint = getWebVectorEndpoint(credProvider);
    expect(webVectorEndpoint).toEqual('https://web.vector.test.momentohq.com');
  });

  it('adds https protocol, but does not add web prefix for overridden endpoints', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      endpointOverrides: {
        controlEndpoint: 'some-control-endpoint',
        cacheEndpoint: 'some-cache-endpoint',
        tokenEndpoint: 'some-token-endpoint',
        vectorEndpoint: 'some-vector-endpoint',
      },
    });
    const webControlEndpoint = getWebControlEndpoint(credProvider);
    expect(webControlEndpoint).toEqual('https://some-control-endpoint');
    const webCacheEndpoint = getWebCacheEndpoint(credProvider);
    expect(webCacheEndpoint).toEqual('https://some-cache-endpoint');
    const webTokenEndpoint = getWebTokenEndpoint(credProvider);
    expect(webTokenEndpoint).toEqual('https://some-token-endpoint');
    const webVectorEndpoint = getWebVectorEndpoint(credProvider);
    expect(webVectorEndpoint).toEqual('https://some-vector-endpoint');
  });
  it('works with overridden endpoints that already have the protocol', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      endpointOverrides: {
        controlEndpoint: 'https://some-control-endpoint',
        cacheEndpoint: 'https://some-cache-endpoint',
        tokenEndpoint: 'http://some-token-endpoint',
        vectorEndpoint: 'http://some-vector-endpoint',
      },
    });
    const webControlEndpoint = getWebControlEndpoint(credProvider);
    expect(webControlEndpoint).toEqual('https://some-control-endpoint');
    const webCacheEndpoint = getWebCacheEndpoint(credProvider);
    expect(webCacheEndpoint).toEqual('https://some-cache-endpoint');
    const webTokenEndpoint = getWebTokenEndpoint(credProvider);
    expect(webTokenEndpoint).toEqual('http://some-token-endpoint');
    const webVectorEndpoint = getWebVectorEndpoint(credProvider);
    expect(webVectorEndpoint).toEqual('http://some-vector-endpoint');
  });
  describe('leaves port intact for overridden endpoints', () => {
    it("with overrides that don't contain protocol", () => {
      const credProvider = CredentialProvider.fromString({
        authToken: base64EncodedFakeV1AuthToken,
        endpointOverrides: {
          controlEndpoint: 'some-control-endpoint:9001',
          cacheEndpoint: 'some-cache-endpoint:9001',
          tokenEndpoint: 'some-token-endpoint:9001',
          vectorEndpoint: 'some-vector-endpoint:9001',
        },
      });
      const webControlEndpoint = getWebControlEndpoint(credProvider);
      expect(webControlEndpoint).toEqual('https://some-control-endpoint:9001');
      const webCacheEndpoint = getWebCacheEndpoint(credProvider);
      expect(webCacheEndpoint).toEqual('https://some-cache-endpoint:9001');
      const webTokenEndpoint = getWebTokenEndpoint(credProvider);
      expect(webTokenEndpoint).toEqual('https://some-token-endpoint:9001');
      const webVectorEndpoint = getWebVectorEndpoint(credProvider);
      expect(webVectorEndpoint).toEqual('https://some-vector-endpoint:9001');
    });
    it('with overrides that do contain protocol', () => {
      const credProvider = CredentialProvider.fromString({
        authToken: base64EncodedFakeV1AuthToken,
        endpointOverrides: {
          controlEndpoint: 'https://some-control-endpoint:9001',
          cacheEndpoint: 'https://some-cache-endpoint:9001',
          tokenEndpoint: 'http://some-token-endpoint:9001',
          vectorEndpoint: 'http://some-vector-endpoint:9001',
        },
      });
      const webControlEndpoint = getWebControlEndpoint(credProvider);
      expect(webControlEndpoint).toEqual('https://some-control-endpoint:9001');
      const webCacheEndpoint = getWebCacheEndpoint(credProvider);
      expect(webCacheEndpoint).toEqual('https://some-cache-endpoint:9001');
      const webTokenEndpoint = getWebTokenEndpoint(credProvider);
      expect(webTokenEndpoint).toEqual('http://some-token-endpoint:9001');
      const webVectorEndpoint = getWebVectorEndpoint(credProvider);
      expect(webVectorEndpoint).toEqual('http://some-vector-endpoint:9001');
    });
  });
});
