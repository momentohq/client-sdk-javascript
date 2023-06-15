import {
  Base64DecodedV1Token,
  encodeToBase64,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {CredentialProvider} from '@gomomento/sdk-core';
import {
  getWebCacheEndpoint,
  getWebControlEndpoint,
} from '../../../src/utils/web-client-utils';

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

describe('getWebControlEndpoint', () => {
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
  });

  it('adds https protocol, but does not add web prefix for overridden endpoints', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      controlEndpoint: 'some-control-endpoint',
      cacheEndpoint: 'some-cache-endpoint',
    });
    const webControlEndpoint = getWebControlEndpoint(credProvider);
    expect(webControlEndpoint).toEqual('https://some-control-endpoint');
  });
  it('works with overridden endpoints that already have the protocol', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      controlEndpoint: 'https://some-control-endpoint',
      cacheEndpoint: 'https://some-cache-endpoint',
    });
    const webControlEndpoint = getWebControlEndpoint(credProvider);
    expect(webControlEndpoint).toEqual('https://some-control-endpoint');
  });
  describe('leaves port intact for overridden endpoints', () => {
    it("with overrides that don't contain protocol", () => {
      const credProvider = CredentialProvider.fromString({
        authToken: base64EncodedFakeV1AuthToken,
        controlEndpoint: 'some-control-endpoint:9001',
        cacheEndpoint: 'some-cache-endpoint:9001',
      });
      const webControlEndpoint = getWebControlEndpoint(credProvider);
      expect(webControlEndpoint).toEqual('https://some-control-endpoint:9001');
    });
    it('with overrides that do contain protocol', () => {
      const credProvider = CredentialProvider.fromString({
        authToken: base64EncodedFakeV1AuthToken,
        controlEndpoint: 'https://some-control-endpoint:9001',
        cacheEndpoint: 'https://some-cache-endpoint:9001',
      });
      const webControlEndpoint = getWebControlEndpoint(credProvider);
      expect(webControlEndpoint).toEqual('https://some-control-endpoint:9001');
    });
  });
});

describe('getWebCacheEndpoint', () => {
  it('adds "https://web." prefix to endpoints that were parsed from legacy tokens', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: fakeTestLegacyToken,
    });
    const webControlEndpoint = getWebCacheEndpoint(credProvider);
    expect(webControlEndpoint).toEqual(
      'https://web.cache-endpoint.not.a.domain'
    );
  });
  it('adds "https://web." prefix to endpoints that were parsed from v1 tokens', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
    });
    const webControlEndpoint = getWebCacheEndpoint(credProvider);
    expect(webControlEndpoint).toEqual('https://web.cache.test.momentohq.com');
  });

  it('adds https protocol, but does not add web prefix for overridden endpoints', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      controlEndpoint: 'some-control-endpoint',
      cacheEndpoint: 'some-cache-endpoint',
    });
    const webControlEndpoint = getWebCacheEndpoint(credProvider);
    expect(webControlEndpoint).toEqual('https://some-cache-endpoint');
  });
  it('works with overridden endpoints that already have the protocol', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      controlEndpoint: 'https://some-control-endpoint',
      cacheEndpoint: 'https://some-cache-endpoint',
    });
    const webControlEndpoint = getWebCacheEndpoint(credProvider);
    expect(webControlEndpoint).toEqual('https://some-cache-endpoint');
  });
  describe('leaves port intact for overridden endpoints', () => {
    it("with overrides that don't contain protocol", () => {
      const credProvider = CredentialProvider.fromString({
        authToken: base64EncodedFakeV1AuthToken,
        controlEndpoint: 'some-control-endpoint:9001',
        cacheEndpoint: 'some-cache-endpoint:9001',
      });
      const webControlEndpoint = getWebCacheEndpoint(credProvider);
      expect(webControlEndpoint).toEqual('https://some-cache-endpoint:9001');
    });
    it('with overrides that do contain protocol', () => {
      const credProvider = CredentialProvider.fromString({
        authToken: base64EncodedFakeV1AuthToken,
        controlEndpoint: 'https://some-control-endpoint:9001',
        cacheEndpoint: 'https://some-cache-endpoint:9001',
      });
      const webControlEndpoint = getWebCacheEndpoint(credProvider);
      expect(webControlEndpoint).toEqual('https://some-cache-endpoint:9001');
    });
  });
});
