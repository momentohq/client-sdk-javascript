import {CredentialProvider} from '../../../src';
import {
  Base64DecodedV1Token,
  encodeToBase64,
} from '../../../src/internal/utils';

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
      apiKey: fakeTestLegacyToken,
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('parses a valid v1 auth token', () => {
    const authProvider = CredentialProvider.fromString({
      apiKey: base64EncodedFakeV1AuthToken,
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${decodedV1Token.endpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual(
      `cache.${decodedV1Token.endpoint}`
    );
  });

  it('supports the old "authToken" option', () => {
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

  it('supports overriding endpoints by specifying a base endpoint', () => {
    const legacyAuthProvider = CredentialProvider.fromString({
      apiKey: fakeTestLegacyToken,
      endpointOverrides: {
        baseEndpoint: 'base.foo',
      },
    });
    expect(legacyAuthProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(legacyAuthProvider.getControlEndpoint()).toEqual('control.base.foo');
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual('cache.base.foo');
    expect(legacyAuthProvider.getTokenEndpoint()).toEqual('token.base.foo');
    expect(legacyAuthProvider.areEndpointsOverridden()).toEqual(true);

    const v1AuthProvider = CredentialProvider.fromString({
      apiKey: base64EncodedFakeV1AuthToken,
      endpointOverrides: {
        baseEndpoint: 'base.foo',
      },
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual('control.base.foo');
    expect(v1AuthProvider.getCacheEndpoint()).toEqual('cache.base.foo');
    expect(v1AuthProvider.getTokenEndpoint()).toEqual('token.base.foo');
    expect(v1AuthProvider.areEndpointsOverridden()).toEqual(true);
  });

  it('supports overriding all endpoints explicitly', () => {
    const legacyAuthProvider = CredentialProvider.fromString({
      apiKey: fakeTestLegacyToken,
      endpointOverrides: {
        controlEndpoint: 'control.foo',
        cacheEndpoint: 'cache.foo',
        tokenEndpoint: 'token.foo',
        storageEndpoint: 'storage.foo',
      },
    });
    expect(legacyAuthProvider.getControlEndpoint()).toEqual('control.foo');
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(legacyAuthProvider.getTokenEndpoint()).toEqual('token.foo');
    expect(legacyAuthProvider.getStorageEndpoint()).toEqual('storage.foo');
    expect(legacyAuthProvider.areEndpointsOverridden()).toEqual(true);

    const v1AuthProvider = CredentialProvider.fromString({
      apiKey: base64EncodedFakeV1AuthToken,
      endpointOverrides: {
        controlEndpoint: 'control.foo',
        cacheEndpoint: 'cache.foo',
        tokenEndpoint: 'token.foo',
        storageEndpoint: 'storage.foo',
      },
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual('control.foo');
    expect(v1AuthProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(v1AuthProvider.getTokenEndpoint()).toEqual('token.foo');
    expect(v1AuthProvider.getStorageEndpoint()).toEqual('storage.foo');
    expect(v1AuthProvider.areEndpointsOverridden()).toEqual(true);
  });

  it('parses a session token with endpoint overrides', () => {
    const sessionTokenProvider = CredentialProvider.fromString({
      apiKey: fakeSessionToken,
      endpointOverrides: {
        controlEndpoint: 'control.foo',
        cacheEndpoint: 'cache.foo',
        tokenEndpoint: 'token.foo',
        storageEndpoint: 'storage.foo',
      },
    });
    expect(sessionTokenProvider.getAuthToken()).toEqual(fakeSessionToken);
    expect(sessionTokenProvider.getControlEndpoint()).toEqual('control.foo');
    expect(sessionTokenProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(sessionTokenProvider.getTokenEndpoint()).toEqual('token.foo');
    expect(sessionTokenProvider.getStorageEndpoint()).toEqual('storage.foo');
    expect(sessionTokenProvider.areEndpointsOverridden()).toEqual(true);
  });

  it('fails to parse a session token with no endpoint overrides', () => {
    expect(() =>
      CredentialProvider.fromString({
        apiKey: fakeSessionToken,
      })
    ).toThrowError('unable to determine control endpoint');
  });
});

describe('EnvMomentoTokenProvider', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('parses a valid legacy token', () => {
    const testEnvVarName = 'TEST_API_KEY_ENV_VAR';
    process.env[testEnvVarName] = fakeTestLegacyToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('parses a valid v1 auth token', () => {
    const testEnvVarName = 'TEST_API_KEY_ENV_VAR';
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

  it('supports overriding endpoints via base endpoint', () => {
    const testEnvVarName = 'TEST_API_KEY_ENV_VAR';
    process.env[testEnvVarName] = fakeTestLegacyToken;
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      endpointOverrides: {
        baseEndpoint: 'base.foo',
      },
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual('control.base.foo');
    expect(authProvider.getCacheEndpoint()).toEqual('cache.base.foo');
    expect(authProvider.getTokenEndpoint()).toEqual('token.base.foo');
    expect(authProvider.areEndpointsOverridden()).toEqual(true);

    process.env[testEnvVarName] = base64EncodedFakeV1AuthToken;
    const v1AuthProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      endpointOverrides: {
        baseEndpoint: 'base.foo',
      },
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual('control.base.foo');
    expect(v1AuthProvider.getCacheEndpoint()).toEqual('cache.base.foo');
    expect(v1AuthProvider.getTokenEndpoint()).toEqual('token.base.foo');
    expect(v1AuthProvider.areEndpointsOverridden()).toEqual(true);
  });

  it('supports overriding all endpoints explicitly', () => {
    const testEnvVarName = 'TEST_API_KEY_ENV_VAR';
    process.env[testEnvVarName] = fakeTestLegacyToken;
    const legacyAuthProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      endpointOverrides: {
        controlEndpoint: 'control.foo',
        cacheEndpoint: 'cache.foo',
        tokenEndpoint: 'token.foo',
        storageEndpoint: 'storage.foo',
      },
    });
    expect(legacyAuthProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(legacyAuthProvider.getControlEndpoint()).toEqual('control.foo');
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(legacyAuthProvider.getTokenEndpoint()).toEqual('token.foo');
    expect(legacyAuthProvider.getStorageEndpoint()).toEqual('storage.foo');
    expect(legacyAuthProvider.areEndpointsOverridden()).toEqual(true);

    process.env[testEnvVarName] = base64EncodedFakeV1AuthToken;
    const v1AuthProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      endpointOverrides: {
        controlEndpoint: 'control.foo',
        cacheEndpoint: 'cache.foo',
        tokenEndpoint: 'token.foo',
        storageEndpoint: 'storage.foo',
      },
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual('control.foo');
    expect(v1AuthProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(v1AuthProvider.getTokenEndpoint()).toEqual('token.foo');
    expect(v1AuthProvider.getStorageEndpoint()).toEqual('storage.foo');
    expect(v1AuthProvider.areEndpointsOverridden()).toEqual(true);
  });

  it('supports adding a prefix to baseEndpoint derived endpoints', () => {
    const testEnvVarName = 'TEST_API_KEY_ENV_VAR';
    process.env[testEnvVarName] = fakeTestLegacyToken;
    const legacyAuthProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      endpointOverrides: {
        baseEndpoint: 'foo',
        endpointPrefix: 'prefix',
      },
    });
    expect(legacyAuthProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(legacyAuthProvider.getControlEndpoint()).toEqual(
      'prefix.control.foo'
    );
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual('prefix.cache.foo');
    expect(legacyAuthProvider.getTokenEndpoint()).toEqual('prefix.token.foo');
    expect(legacyAuthProvider.areEndpointsOverridden()).toEqual(true);

    process.env[testEnvVarName] = base64EncodedFakeV1AuthToken;
    const v1AuthProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      endpointOverrides: {
        baseEndpoint: 'foo',
        endpointPrefix: 'prefix',
      },
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual('prefix.control.foo');
    expect(v1AuthProvider.getCacheEndpoint()).toEqual('prefix.cache.foo');
    expect(v1AuthProvider.getTokenEndpoint()).toEqual('prefix.token.foo');
    expect(v1AuthProvider.areEndpointsOverridden()).toEqual(true);
  });
});
