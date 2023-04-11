import {CredentialProvider} from '../../../src/auth/credential-provider';
import {Base64DecodedV1Token} from '../../../src/internal/utils/auth';
import {encodeToBase64} from '../../../src/internal/utils/string';

const testLegacyToken =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJmb29Abm90LmEuZG9tYWluIiwiY3AiOiJjb250cm9sLXBsYW5lLWVuZHBvaW50Lm5vdC5hLmRvbWFpbiIsImMiOiJjYWNoZS1lbmRwb2ludC5ub3QuYS5kb21haW4ifQo.rtxfu4miBHQ1uptWJ2x3UiAwwJYcMeYIkkpXxUno_wIavg4h6YJStcbxk32NDBbmJkJS7mUw6MsvJNWaxfdPOw';
const testV1ApiKey =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NzgzMDU4MTIsImV4cCI6NDg2NTUxNTQxMiwiYXVkIjoiIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSJ9.8Iy8q84Lsr-D3YCo_HP4d-xjHdT8UCIuvAYcxhFMyz8';
const decodedV1Token: Base64DecodedV1Token = {
  api_key: testV1ApiKey,
  endpoint: 'test.momentohq.com',
};
const base64EncodedV1Token = encodeToBase64(JSON.stringify(decodedV1Token));
const testControlEndpoint = 'control-plane-endpoint.not.a.domain';
const testCacheEndpoint = 'cache-endpoint.not.a.domain';

describe('StringMomentoTokenProvider', () => {
  it('parses a valid legacy token', () => {
    const authProvider = CredentialProvider.fromString({
      authToken: testLegacyToken,
    });
    expect(authProvider.getAuthToken()).toEqual(testLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('parses a valid v1 api token', () => {
    const authProvider = CredentialProvider.fromString({
      authToken: base64EncodedV1Token,
    });
    expect(authProvider.getAuthToken()).toEqual(testV1ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${decodedV1Token.endpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual(
      `cache.${decodedV1Token.endpoint}`
    );
  });

  it('supports overriding control endpoint', () => {
    const legacyAuthProvider = CredentialProvider.fromString({
      authToken: testLegacyToken,
      controlEndpoint: 'foo',
    });
    expect(legacyAuthProvider.getAuthToken()).toEqual(testLegacyToken);
    expect(legacyAuthProvider.getControlEndpoint()).toEqual('foo');
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);

    const v1AuthProvider = CredentialProvider.fromString({
      authToken: base64EncodedV1Token,
      controlEndpoint: 'foo',
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(testV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual('foo');
    expect(v1AuthProvider.getCacheEndpoint()).toEqual(
      `cache.${decodedV1Token.endpoint}`
    );
  });

  it('supports overriding cache endpoint', () => {
    const legacyAuthProvider = CredentialProvider.fromString({
      authToken: testLegacyToken,
      cacheEndpoint: 'foo',
    });
    expect(legacyAuthProvider.getAuthToken()).toEqual(testLegacyToken);
    expect(legacyAuthProvider.getControlEndpoint()).toEqual(
      testControlEndpoint
    );
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual('foo');

    const v1AuthProvider = CredentialProvider.fromString({
      authToken: base64EncodedV1Token,
      cacheEndpoint: 'foo',
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(testV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual(
      `control.${decodedV1Token.endpoint}`
    );
    expect(v1AuthProvider.getCacheEndpoint()).toEqual('foo');
  });
});

describe('EnvMomentoTokenProvider', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('parses a valid legacy token', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = testLegacyToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
    });
    expect(authProvider.getAuthToken()).toEqual(testLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('parses a valid v1 api token', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = base64EncodedV1Token;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
    });
    expect(authProvider.getAuthToken()).toEqual(testV1ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${decodedV1Token.endpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual(
      `cache.${decodedV1Token.endpoint}`
    );
  });

  it('supports overriding control endpoint for legacy tokens', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = testLegacyToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      controlEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual('foo');
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding cache endpoint for legacy tokens', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = testLegacyToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      cacheEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual('foo');
  });

  it('supports overriding control endpoint for v1 api tokens', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = base64EncodedV1Token;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      controlEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testV1ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual('foo');
    expect(authProvider.getCacheEndpoint()).toEqual(
      `cache.${decodedV1Token.endpoint}`
    );
  });

  it('supports overriding cache endpoint for v1 api tokens', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = base64EncodedV1Token;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      cacheEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testV1ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${decodedV1Token.endpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual('foo');
  });
});
