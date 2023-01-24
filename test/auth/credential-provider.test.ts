import {
  StringMomentoTokenProvider,
  EnvMomentoTokenProvider,
} from '../../src/auth/credential-provider';

const testToken =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJmb29AYmFyLmNvbSIsImNwIjoiY29udHJvbC1wbGFuZS1lbmRwb2ludC5iYXIuY29tIiwiYyI6ImNhY2hlLWVuZHBvaW50LmJhci5jb20ifQo.rtxfu4miBHQ1uptWJ2x3UiAwwJYcMeYIkkpXxUno_wIavg4h6YJStcbxk32NDBbmJkJS7mUw6MsvJNWaxfdPOw';
const testControlEndpoint = 'control-plane-endpoint.bar.com';
const testCacheEndpoint = 'cache-endpoint.bar.com';

describe('StringMomentoTokenProvider', () => {
  it('parses a valid token', () => {
    const authProvider = new StringMomentoTokenProvider({authToken: testToken});
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding control endpoint', () => {
    const authProvider = new StringMomentoTokenProvider({
      authToken: testToken,
      controlEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual('foo');
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding cache endpoint', () => {
    const authProvider = new StringMomentoTokenProvider({
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
    const authProvider = new EnvMomentoTokenProvider({
      environmentVariableName: testEnvVarName,
    });
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding control endpoint', () => {
    const authProvider = new EnvMomentoTokenProvider({
      environmentVariableName: testEnvVarName,
      controlEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual('foo');
    expect(authProvider.getCacheEndpoint()).toEqual(testCacheEndpoint);
  });

  it('supports overriding cache endpoint', () => {
    const authProvider = new EnvMomentoTokenProvider({
      environmentVariableName: testEnvVarName,
      cacheEndpoint: 'foo',
    });
    expect(authProvider.getAuthToken()).toEqual(testToken);
    expect(authProvider.getControlEndpoint()).toEqual(testControlEndpoint);
    expect(authProvider.getCacheEndpoint()).toEqual('foo');
  });
});
