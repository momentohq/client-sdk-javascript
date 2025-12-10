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

const apiKeyEnvVar = 'MOMENTO_TEST_V2_API_KEY';
const testV2ApiKey =
  'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZyIsImlkIjoic29tZS1pZCJ9.WRhKpdh7cFCXO7lAaVojtQAxK6mxMdBrvXTJL1xu94S0d6V1YSstOObRlAIMA7i_yIxO1mWEF3rlF5UNc77VXQ';
const testEndpoint = 'testEndpoint';
const endpointEnvVar = 'MOMENTO_TEST_ENDPOINT';

describe('StringMomentoTokenProvider', () => {
  it('parses a valid legacy token', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const authProvider = CredentialProvider.fromString({
      apiKey: fakeTestLegacyToken,
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('parses a valid v1 auth token', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const legacyAuthProvider = CredentialProvider.fromString({
      apiKey: fakeTestLegacyToken,
      endpointOverrides: {
        controlEndpoint: 'control.foo',
        cacheEndpoint: 'cache.foo',
        tokenEndpoint: 'token.foo',
      },
    });
    expect(legacyAuthProvider.getControlEndpoint()).toEqual('control.foo');
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(legacyAuthProvider.getTokenEndpoint()).toEqual('token.foo');
    expect(legacyAuthProvider.areEndpointsOverridden()).toEqual(true);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const v1AuthProvider = CredentialProvider.fromString({
      apiKey: base64EncodedFakeV1AuthToken,
      endpointOverrides: {
        controlEndpoint: 'control.foo',
        cacheEndpoint: 'cache.foo',
        tokenEndpoint: 'token.foo',
      },
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual('control.foo');
    expect(v1AuthProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(v1AuthProvider.getTokenEndpoint()).toEqual('token.foo');
    expect(v1AuthProvider.areEndpointsOverridden()).toEqual(true);
  });

  it('parses a session token with endpoint overrides', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const sessionTokenProvider = CredentialProvider.fromString({
      apiKey: fakeSessionToken,
      endpointOverrides: {
        controlEndpoint: 'control.foo',
        cacheEndpoint: 'cache.foo',
        tokenEndpoint: 'token.foo',
      },
    });
    expect(sessionTokenProvider.getAuthToken()).toEqual(fakeSessionToken);
    expect(sessionTokenProvider.getControlEndpoint()).toEqual('control.foo');
    expect(sessionTokenProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(sessionTokenProvider.getTokenEndpoint()).toEqual('token.foo');
    expect(sessionTokenProvider.areEndpointsOverridden()).toEqual(true);
  });

  it('fails to parse a session token with no endpoint overrides', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      CredentialProvider.fromString({
        apiKey: fakeSessionToken,
      })
    ).toThrowError('unable to determine control endpoint');
  });

  it('throws an error when provided with a v2 api key', () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      CredentialProvider.fromString({
        apiKey: testV2ApiKey,
      })
    ).toThrowError();
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
      },
    });
    expect(legacyAuthProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(legacyAuthProvider.getControlEndpoint()).toEqual('control.foo');
    expect(legacyAuthProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(legacyAuthProvider.getTokenEndpoint()).toEqual('token.foo');
    expect(legacyAuthProvider.areEndpointsOverridden()).toEqual(true);

    process.env[testEnvVarName] = base64EncodedFakeV1AuthToken;
    const v1AuthProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      endpointOverrides: {
        controlEndpoint: 'control.foo',
        cacheEndpoint: 'cache.foo',
        tokenEndpoint: 'token.foo',
      },
    });
    expect(v1AuthProvider.getAuthToken()).toEqual(fakeTestV1ApiKey);
    expect(v1AuthProvider.getControlEndpoint()).toEqual('control.foo');
    expect(v1AuthProvider.getCacheEndpoint()).toEqual('cache.foo');
    expect(v1AuthProvider.getTokenEndpoint()).toEqual('token.foo');
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

  it('throws an error when provided with a v2 api key', () => {
    process.env[apiKeyEnvVar] = testV2ApiKey;
    expect(() =>
      CredentialProvider.fromEnvironmentVariable({
        environmentVariableName: apiKeyEnvVar,
      })
    ).toThrowError();
  });
});

describe('ApiKeyV2TokenProvider', () => {
  it('parses an apiKey with endpoint and constructs proper endpoints', () => {
    const authProvider = CredentialProvider.fromApiKeyV2({
      apiKey: testV2ApiKey,
      endpoint: testEndpoint,
    });
    expect(authProvider.getAuthToken()).toEqual(testV2ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${testEndpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual(`cache.${testEndpoint}`);
    expect(authProvider.getTokenEndpoint()).toEqual(`token.${testEndpoint}`);
    expect(authProvider.areEndpointsOverridden()).toEqual(false);
    expect(authProvider.isEndpointSecure()).toEqual(true);
  });

  it('supports the authToken option', () => {
    const authProvider = CredentialProvider.fromApiKeyV2({
      authToken: testV2ApiKey,
      endpoint: testEndpoint,
    });
    expect(authProvider.getAuthToken()).toEqual(testV2ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${testEndpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual(`cache.${testEndpoint}`);
    expect(authProvider.getTokenEndpoint()).toEqual(`token.${testEndpoint}`);
  });

  it('throws an error when apiKey/authToken is missing', () => {
    expect(() =>
      CredentialProvider.fromApiKeyV2({
        endpoint: testEndpoint,
        apiKey: '',
      })
    ).toThrowError('API key cannot be an empty string');
  });

  it('throws an error when endpoint is missing', () => {
    expect(() =>
      CredentialProvider.fromApiKeyV2({
        apiKey: testV2ApiKey,
        endpoint: '',
      })
    ).toThrowError('Endpoint cannot be an empty string');
  });

  it('throws an error when provided with a v1 api key', () => {
    expect(() =>
      CredentialProvider.fromApiKeyV2({
        apiKey: fakeTestV1ApiKey,
        endpoint: testEndpoint,
      })
    ).toThrowError();
  });

  it('throws an error when provided with a pre-v1 api key', () => {
    expect(() =>
      CredentialProvider.fromApiKeyV2({
        apiKey: fakeTestLegacyToken,
        endpoint: testEndpoint,
      })
    ).toThrowError();
  });
});

describe('EnvVarV2TokenProvider', () => {
  afterEach(() => {
    delete process.env[apiKeyEnvVar];
    delete process.env[endpointEnvVar];
    jest.resetModules();
  });

  it('parses an apiKey from environment variable with endpoint', () => {
    process.env[apiKeyEnvVar] = testV2ApiKey;
    process.env[endpointEnvVar] = testEndpoint;
    const authProvider = CredentialProvider.fromEnvVarV2({
      apiKeyEnvVar,
      endpointEnvVar,
    });
    expect(authProvider.getAuthToken()).toEqual(testV2ApiKey);
    expect(authProvider.getControlEndpoint()).toEqual(
      `control.${testEndpoint}`
    );
    expect(authProvider.getCacheEndpoint()).toEqual(`cache.${testEndpoint}`);
    expect(authProvider.getTokenEndpoint()).toEqual(`token.${testEndpoint}`);
    expect(authProvider.areEndpointsOverridden()).toEqual(false);
    expect(authProvider.isEndpointSecure()).toEqual(true);
  });

  it('throws an error when api key env var is not set', () => {
    process.env[endpointEnvVar] = testEndpoint;
    expect(() =>
      CredentialProvider.fromEnvVarV2({
        apiKeyEnvVar,
        endpointEnvVar,
      })
    ).toThrowError(`Empty value for environment variable ${apiKeyEnvVar}`);
  });

  it('throws an error when endpoint env var is not set', () => {
    process.env[apiKeyEnvVar] = testV2ApiKey;
    expect(() =>
      CredentialProvider.fromEnvVarV2({
        apiKeyEnvVar,
        endpointEnvVar,
      })
    ).toThrowError(`Empty value for environment variable ${endpointEnvVar}`);
  });

  it('throws an error when api key env var is empty', () => {
    process.env[apiKeyEnvVar] = '';
    process.env[endpointEnvVar] = testEndpoint;
    expect(() =>
      CredentialProvider.fromEnvVarV2({
        apiKeyEnvVar,
        endpointEnvVar,
      })
    ).toThrowError(`Empty value for environment variable ${apiKeyEnvVar}`);
  });

  it('throws an error when endpoint is missing', () => {
    process.env[apiKeyEnvVar] = testV2ApiKey;
    process.env[endpointEnvVar] = '';
    expect(() =>
      CredentialProvider.fromEnvVarV2({
        apiKeyEnvVar,
        endpointEnvVar,
      })
    ).toThrowError(`Empty value for environment variable ${endpointEnvVar}`);
  });

  it('throws an error when api key env var name is missing', () => {
    process.env[endpointEnvVar] = testEndpoint;
    expect(() =>
      CredentialProvider.fromEnvVarV2({
        apiKeyEnvVar: '',
        endpointEnvVar,
      })
    ).toThrowError();
  });

  it('throws an error when endpoint env var name is missing', () => {
    process.env[apiKeyEnvVar] = testV2ApiKey;
    expect(() =>
      CredentialProvider.fromEnvVarV2({
        apiKeyEnvVar,
        endpointEnvVar: '',
      })
    ).toThrowError();
  });

  it('throws an error when provided with a v1 api key', () => {
    process.env[apiKeyEnvVar] = fakeTestV1ApiKey;
    process.env[endpointEnvVar] = testEndpoint;
    expect(() =>
      CredentialProvider.fromEnvVarV2({
        apiKeyEnvVar,
        endpointEnvVar,
      })
    ).toThrowError();
  });

  it('throws an error when provided with a pre-v1 api key', () => {
    process.env[apiKeyEnvVar] = fakeTestLegacyToken;
    process.env[endpointEnvVar] = testEndpoint;
    expect(() =>
      CredentialProvider.fromEnvVarV2({
        apiKeyEnvVar,
        endpointEnvVar,
      })
    ).toThrowError();
  });
});

describe('fromDisposableToken', () => {
  it('throws an error when provided with a v2 api key', () => {
    expect(() =>
      CredentialProvider.fromDisposableToken({
        apiKey: testV2ApiKey,
      })
    ).toThrowError();
  });

  it('parses a valid legacy token', () => {
    const authProvider = CredentialProvider.fromDisposableToken({
      apiKey: fakeTestLegacyToken,
    });
    expect(authProvider.getAuthToken()).toEqual(fakeTestLegacyToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('parses a valid v1 auth token', () => {
    const authProvider = CredentialProvider.fromDisposableToken({
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
});
