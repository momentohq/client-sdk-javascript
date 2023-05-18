import {CredentialProvider} from '../../../src/auth/credential-provider';
import {Base64DecodedV1Token} from '../../../src/internal/utils/auth';
import {encodeToBase64} from '../../../src/internal/utils/string';

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
const fakeSessionToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN6eTVJLU5oaDZONjZUbTJfeld2UyJ9.eyJlbWFpbCI6ImNocmlzQG1vbWVudG9ocS5jb20iLCJpc3MiOiJodHRwczovL2xvZ2luLXByZXByb2QuZ29tb21lbnRvLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMDE5OTE5NjYwNDc0NDEwMjQyNSIsImF1ZCI6WyJodHRwczovL3ByZXByb2QiLCJodHRwczovL3ByZXByb2QtbW9tZW50by51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjg0Mjg1NDIyLCJleHAiOjE2ODQzNzE4MjIsImF6cCI6InRibFdPYk02Zk9iNkJsQWwzUjFPcWZUNTlrTEY3VGJiIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCJ9.CKJn23XJ9L-seTfOo8OdAbBSP-2DPEM7hvOT1FayojJJvNmyNHzPxcftANlL64lpu5KWIZHwkNaptwkT8v2m7TVeqzDUR52Zqzk7TvQv-FQD_iI4INebPQrCnCKF2ByqC3fdlfrdXBxErF7rOJRKwyugKNhG7WVtjlm9pKOnIIFpUW_0mxWBObrgMhr1qIOaRPoGhyu1TXVgbdn6GLwBDeDI5XbHvgWiMixgs1BpGe_sOOYIcy8l0_TgwQtqUg9GG9Q88Pdde90w_eGLb6bB2QOqXwksBr8zK-z-VZZsiNVdzokKvAvUt3Ev4F1N8Np9ehFbXnzNsTmh1VqkNESy4w';

const testControlEndpoint = 'control-plane-endpoint.not.a.domain';
const testCacheEndpoint = 'cache-endpoint.not.a.domain';

describe('StringMomentoTokenProvider', () => {
  it('parses a valid legacy token', () => {
    const authProvider = CredentialProvider.fromString({
      authToken: fakeTestLegacyToken,
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('parses a valid v1 auth token', () => {
    const authProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${decodedV1Token.endpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual(
      `cache.${decodedV1Token.endpoint}`
    );
  });

  it('supports overriding control endpoint', () => {
    const legacyAuthProvider = CredentialProvider.fromString({
      authToken: fakeTestLegacyToken,
      controlEndpoint: 'foo',
    });
    expect(legacyAuthProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(legacyAuthProvider.getControlEndpoint()).toEqual('foo');
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);

    const v1AuthProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      controlEndpoint: 'foo',
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual('foo');
    expect(v1AuthProvider.getCacheEndpoint()).toEqual(
      `cache.${decodedV1Token.endpoint}`
    );
  });

  it('supports overriding cache endpoint', () => {
    const legacyAuthProvider = CredentialProvider.fromString({
      authToken: fakeTestLegacyToken,
      cacheEndpoint: 'foo',
    });
    expect(legacyAuthProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(legacyAuthProvider.getControlEndpoint()).toEqual(
      testControlEndpoint
    );
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual('foo');

    const v1AuthProvider = CredentialProvider.fromString({
      authToken: base64EncodedFakeV1AuthToken,
      cacheEndpoint: 'foo',
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual(
      `control.${decodedV1Token.endpoint}`
    );
    expect(v1AuthProvider.getCacheEndpoint()).toEqual('foo');
  });

  it('parses a session token with endpoint overrides', () => {
    const sessionTokenProvider = CredentialProvider.fromString({
      authToken: fakeSessionToken,
      controlEndpoint: 'control.foo',
      cacheEndpoint: 'cache.foo',
    });
    expect(sessionTokenProvider.getAuthToken()).toEqual(fakeSessionToken);
    expect(sessionTokenProvider.getControlEndpoint()).toEqual('control.foo');
    expect(sessionTokenProvider.getCacheEndpoint()).toEqual('cache.foo');
  });

  it('fails to parse a session token with no endpoint overrides', () => {
    expect(() =>
      CredentialProvider.fromString({
        authToken: fakeSessionToken,
      })
    ).toThrowError('unable to determine control endpoint');
    expect(() =>
      CredentialProvider.fromString({
        authToken: fakeSessionToken,
        controlEndpoint: 'control.foo',
      })
    ).toThrowError('unable to determine cache endpoint');
  });
});

describe('EnvMomentoTokenProvider', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('parses a valid legacy token', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = fakeTestLegacyToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('parses a valid v1 auth token', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = base64EncodedFakeV1AuthToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${decodedV1Token.endpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual(
      `cache.${decodedV1Token.endpoint}`
    );
  });

  it('supports overriding control endpoint for legacy tokens', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = fakeTestLegacyToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      controlEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual('foo');
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding cache endpoint for legacy tokens', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = fakeTestLegacyToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      cacheEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual('foo');
  });

  it('supports overriding control endpoint for v1 api tokens', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = base64EncodedFakeV1AuthToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      controlEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual('foo');
    expect(authProvider.getCacheEndpoint()).toEqual(
      `cache.${decodedV1Token.endpoint}`
    );
  });

  it('supports overriding cache endpoint for v1 api tokens', () => {
    const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
    process.env[testEnvVarName] = base64EncodedFakeV1AuthToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      cacheEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${decodedV1Token.endpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual('foo');
  });
});
