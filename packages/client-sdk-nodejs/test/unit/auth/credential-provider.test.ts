import {CredentialProvider} from '../../../src/auth/credential-provider';

const testToken =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJmb29Abm90LmEuZG9tYWluIiwiY3AiOiJjb250cm9sLXBsYW5lLWVuZHBvaW50Lm5vdC5hLmRvbWFpbiIsImMiOiJjYWNoZS1lbmRwb2ludC5ub3QuYS5kb21haW4ifQo.rtxfu4miBHQ1uptWJ2x3UiAwwJYcMeYIkkpXxUno_wIavg4h6YJStcbxk32NDBbmJkJS7mUw6MsvJNWaxfdPOw';
const testControlEndpoint = 'control-plane-endpoint.not.a.domain';
const testCacheEndpoint = 'cache-endpoint.not.a.domain';

describe('StringMomentoTokenProvider', () => {
  it('parses a valid token', () => {
    const authProvider = CredentialProvider.fromString({authToken: testToken});
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding control endpoint', () => {
    const authProvider = CredentialProvider.fromString({
      authToken: testToken,
      controlEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual('foo');
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding cache endpoint', () => {
    const authProvider = CredentialProvider.fromString({
      authToken: testToken,
      cacheEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual('foo');
  });
});

describe('EnvMomentoTokenProvider', () => {
  const testEnvVarName = 'TEST_AUTH_TOKEN_ENV_VAR';
  process.env[testEnvVarName] = testToken;

  it('parses a valid token', () => {
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
    });
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding control endpoint', () => {
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      controlEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual('foo');
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding cache endpoint', () => {
    const authProvider = CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: testEnvVarName,
      cacheEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual('foo');
  });
});
