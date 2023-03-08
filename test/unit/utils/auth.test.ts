import {
  Base64DecodedV1Token,
  decodeAuthToken,
} from '../../../src/internal/utils/auth';
import {InvalidArgumentError} from '../../../src';

const TEST_LEGACY_AUTH_TOKEN_NO_ENDPOINT =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJpbnRlZ3JhdGlvbiJ9.ZOgkTs';
const TEST_LEGACY_AUTH_TOKEN_ENDPOINT =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI';
const MALFORMED_TOKEN = 'fsaf';
const V1_API_KEY =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NzgzMDU4MTIsImV4cCI6NDg2NTUxNTQxMiwiYXVkIjoiIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSJ9.8Iy8q84Lsr-D3YCo_HP4d-xjHdT8UCIuvAYcxhFMyz8';

describe('auth.ts', () => {
  it('should parse endpoints from legacy auth tokens', () => {
    const res = decodeAuthToken(TEST_LEGACY_AUTH_TOKEN_ENDPOINT);
    expect(res.controlEndpoint).toEqual('control plane endpoint');
    expect(res.cacheEndpoint).toEqual('data plane endpoint');
    expect(res.authToken).toEqual(TEST_LEGACY_AUTH_TOKEN_ENDPOINT);

    const noEndpoints = decodeAuthToken(TEST_LEGACY_AUTH_TOKEN_NO_ENDPOINT);
    expect(noEndpoints.authToken).toEqual(TEST_LEGACY_AUTH_TOKEN_NO_ENDPOINT);
    expect(noEndpoints.controlEndpoint).toBeUndefined();
    expect(noEndpoints.cacheEndpoint).toBeUndefined();
  });
  it('should parse endpoints from v1 auth token', () => {
    const decodedToken: Base64DecodedV1Token = {
      api_key: V1_API_KEY,
      endpoint: 'test.momentohq.com',
    };
    const base64EncodedToken = btoa(JSON.stringify(decodedToken));
    const res = decodeAuthToken(base64EncodedToken);
    expect(res.cacheEndpoint).toEqual(`data.${decodedToken.endpoint}`);
    expect(res.controlEndpoint).toEqual(`control.${decodedToken.endpoint}`);
    expect(res.authToken).toEqual(decodedToken.api_key);
  });

  it('should throw InvalidArgumentError if no token is passed', () => {
    expect(decodeAuthToken).toThrow(InvalidArgumentError);
  });

  it('should throw InvalidJwtError when token is malformed', () => {
    expect(() => decodeAuthToken(MALFORMED_TOKEN)).toThrow(
      InvalidArgumentError
    );
  });
});
