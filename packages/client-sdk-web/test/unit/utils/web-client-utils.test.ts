import {
  Base64DecodedV1Token,
  encodeToBase64,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {CredentialProvider} from '@gomomento/sdk-core';
import {
  convertToB64String,
  convertToBytesFromB64String,
  convertToStringFromB64String,
  getWebCacheEndpoint,
  getWebControlEndpoint,
  getWebTokenEndpoint,
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
  });

  it('adds https protocol, but does not add web prefix for overridden endpoints', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      endpointOverrides: {
        controlEndpoint: 'some-control-endpoint',
        cacheEndpoint: 'some-cache-endpoint',
        tokenEndpoint: 'some-token-endpoint',
      },
    });
    const webControlEndpoint = getWebControlEndpoint(credProvider);
    expect(webControlEndpoint).toEqual('https://some-control-endpoint');
    const webCacheEndpoint = getWebCacheEndpoint(credProvider);
    expect(webCacheEndpoint).toEqual('https://some-cache-endpoint');
    const webTokenEndpoint = getWebTokenEndpoint(credProvider);
    expect(webTokenEndpoint).toEqual('https://some-token-endpoint');
  });
  it('works with overridden endpoints that already have the protocol', () => {
    const credProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      endpointOverrides: {
        controlEndpoint: 'https://some-control-endpoint',
        cacheEndpoint: 'https://some-cache-endpoint',
        tokenEndpoint: 'http://some-token-endpoint',
      },
    });
    const webControlEndpoint = getWebControlEndpoint(credProvider);
    expect(webControlEndpoint).toEqual('https://some-control-endpoint');
    const webCacheEndpoint = getWebCacheEndpoint(credProvider);
    expect(webCacheEndpoint).toEqual('https://some-cache-endpoint');
    const webTokenEndpoint = getWebTokenEndpoint(credProvider);
    expect(webTokenEndpoint).toEqual('http://some-token-endpoint');
  });
  describe('leaves port intact for overridden endpoints', () => {
    it("with overrides that don't contain protocol", () => {
      const credProvider = CredentialProvider.fromString({
        authToken: base64EncodedFakeV1AuthToken,
        endpointOverrides: {
          controlEndpoint: 'some-control-endpoint:9001',
          cacheEndpoint: 'some-cache-endpoint:9001',
          tokenEndpoint: 'some-token-endpoint:9001',
        },
      });
      const webControlEndpoint = getWebControlEndpoint(credProvider);
      expect(webControlEndpoint).toEqual('https://some-control-endpoint:9001');
      const webCacheEndpoint = getWebCacheEndpoint(credProvider);
      expect(webCacheEndpoint).toEqual('https://some-cache-endpoint:9001');
      const webTokenEndpoint = getWebTokenEndpoint(credProvider);
      expect(webTokenEndpoint).toEqual('https://some-token-endpoint:9001');
    });
    it('with overrides that do contain protocol', () => {
      const credProvider = CredentialProvider.fromString({
        authToken: base64EncodedFakeV1AuthToken,
        endpointOverrides: {
          controlEndpoint: 'https://some-control-endpoint:9001',
          cacheEndpoint: 'https://some-cache-endpoint:9001',
          tokenEndpoint: 'http://some-token-endpoint:9001',
        },
      });
      const webControlEndpoint = getWebControlEndpoint(credProvider);
      expect(webControlEndpoint).toEqual('https://some-control-endpoint:9001');
      const webCacheEndpoint = getWebCacheEndpoint(credProvider);
      expect(webCacheEndpoint).toEqual('https://some-cache-endpoint:9001');
      const webTokenEndpoint = getWebTokenEndpoint(credProvider);
      expect(webTokenEndpoint).toEqual('http://some-token-endpoint:9001');
    });
  });

  describe('convertToB64String', () => {
    it('should convert a simple string to base64 and back to string', () => {
      const input = 'hello';
      const expected = 'aGVsbG8=';
      const output = convertToB64String(input);
      expect(output).toEqual(expected);
      const simpleString = convertToStringFromB64String(output);
      expect(simpleString).toEqual(input);
    });
    it('should convert a string with special characters to base64 and back to string with special characters', () => {
      const input = 'héllö wörld';
      const expectedOutput = 'aMOpbGzDtiB3w7ZybGQ=';
      const output = convertToB64String(input);
      expect(output).toBe(expectedOutput);
      const specialString = convertToStringFromB64String(output);
      expect(specialString).toEqual(input);
    });
    it('should convert a string with emojis to base64 and back to string with emojis', () => {
      const input = 'hello 🌍';
      const expectedOutput = 'aGVsbG8g8J+MjQ==';
      const output = convertToB64String(input);
      expect(output).toBe(expectedOutput);
      const emojiString = convertToStringFromB64String(output);
      expect(emojiString).toEqual(input);
    });
    it('should convert a Uint8Array to base64 and back to UintArray', () => {
      const input = new Uint8Array([104, 101, 108, 108, 111]);
      const expectedOutput = 'aGVsbG8=';
      const output = convertToB64String(input);
      expect(output).toBe(expectedOutput);
      const simpleUint8Array = convertToBytesFromB64String(output);
      expect(simpleUint8Array).toEqual(input);
    });
    it('should convert a Uint8Array with special characters to base64 and back to UintArray with special characters', () => {
      const input = new Uint8Array([104, 195, 169, 108, 108, 195, 182]);
      const expectedOutput = 'aMOpbGzDtg==';
      const output = convertToB64String(input);
      expect(output).toBe(expectedOutput);
      const specialUint8Array = convertToBytesFromB64String(output);
      expect(specialUint8Array).toEqual(input);
    });
  });
});
