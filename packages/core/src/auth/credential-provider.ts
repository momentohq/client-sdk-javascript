import {
  AllEndpoints,
  decodeAuthToken,
  fromEntries,
  isV2ApiKey,
  populateAllEndpointsFromBaseEndpoint,
} from '../internal/utils';

export interface BaseEndpointOverride {
  baseEndpoint: string;
  endpointPrefix?: string;
  secureConnection?: boolean;
}

export type EndpointOverrides = BaseEndpointOverride | AllEndpoints;

function isBaseEndpointOverride(
  endpointOverrides: EndpointOverrides
): endpointOverrides is BaseEndpointOverride {
  return (endpointOverrides as BaseEndpointOverride).baseEndpoint !== undefined;
}

function isAllEndpoints(
  endpointOverrides: EndpointOverrides
): endpointOverrides is AllEndpoints {
  const allEndpoints = endpointOverrides as AllEndpoints;
  return (
    allEndpoints.cacheEndpoint !== undefined &&
    allEndpoints.controlEndpoint !== undefined &&
    allEndpoints.tokenEndpoint !== undefined
  );
}

/**
 * Encapsulates arguments for instantiating an EnvMomentoTokenProvider
 */
interface CredentialProviderProps {
  endpointOverrides?: EndpointOverrides;
}

/**
 * Provides information that the CacheClient needs in order to establish a connection to and authenticate with
 * the Momento service.
 * @export
 * @interface CredentialProvider
 */
export abstract class CredentialProvider {
  /**
   * @returns {string} Auth token provided by user, required to authenticate with the service
   */
  abstract getAuthToken(): string;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento control plane operations
   */
  abstract getControlEndpoint(): string;

  /**
   * @deprecated use isEndpointSecure() instead
   */
  abstract isControlEndpointSecure(): boolean;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento data plane operations
   */
  abstract getCacheEndpoint(): string;

  /**
   * @deprecated use isEndpointSecure() instead
   */
  abstract isCacheEndpointSecure(): boolean;

  /**
   * @returns {string} The host which the Momento client will connect to for Momento token operations
   */
  abstract getTokenEndpoint(): string;

  /**
   * @deprecated use isEndpointSecure() instead
   */
  abstract isTokenEndpointSecure(): boolean;

  /**
   * @deprecated - use the static method forMomentoLocal instead
   *
   * Modifies the instance of the credential provider to override endpoints to
   * allow insecure connections to the momento-local service for testing purposes
   */
  abstract withMomentoLocal(): CredentialProvider;

  /**
   * @returns {boolean} true if the endpoints were manually overridden at construction time; false otherwise
   */
  abstract areEndpointsOverridden(): boolean;
  /**
   * @returns {boolean} true if connecting to the endpoint connection with TLS; false if not using TLS
   */
  abstract isEndpointSecure(): boolean;

  /**
   * @deprecated use fromEnvVarV2() instead
   */
  static fromEnvironmentVariable(
    props: EnvMomentoTokenProviderProps | string
  ): CredentialProvider {
    return new EnvMomentoTokenProvider(props);
  }

  /**
   * @deprecated use fromEnvVarV2() instead
   */
  static fromEnvVar(
    props: EnvMomentoTokenProviderProps | string
  ): CredentialProvider {
    return new EnvMomentoTokenProvider(props);
  }

  /**
   * @deprecated use fromApiKeyV2() or fromDisposableToken() instead
   */
  static fromString(
    props: StringMomentoTokenProviderProps | string
  ): CredentialProvider {
    return new StringMomentoTokenProvider(props);
  }

  static fromDisposableToken(
    props: StringMomentoTokenProviderProps | string
  ): CredentialProvider {
    return new StringMomentoTokenProvider(props);
  }

  static fromEnvVarV2(props: EnvVarV2TokenProviderProps): CredentialProvider {
    return new EnvVarV2TokenProvider(props);
  }

  static fromApiKeyV2(props: ApiKeyV2TokenProviderProps): CredentialProvider {
    return new ApiKeyV2TokenProvider(props);
  }

  /**
   * Allow insecure connections to momento-local service for testing purposes.
   * Does not require a Momento API key.
   * @param props configuration options for connecting to momento-local
   * @returns CredentialProvider
   */
  static forMomentoLocal(props: MomentoLocalProviderProps): CredentialProvider {
    return new MomentoLocalProvider(props);
  }
}

abstract class CredentialProviderBase implements CredentialProvider {
  abstract getAuthToken(): string;

  abstract getCacheEndpoint(): string;

  abstract isCacheEndpointSecure(): boolean;

  abstract getControlEndpoint(): string;

  abstract isControlEndpointSecure(): boolean;

  abstract getTokenEndpoint(): string;

  abstract isTokenEndpointSecure(): boolean;

  abstract areEndpointsOverridden(): boolean;

  abstract isEndpointSecure(): boolean;

  abstract withMomentoLocal(): CredentialProvider;

  valueOf(): object {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const entries = Object.entries(this).filter(([k]) => k !== 'authToken');
    const clone = fromEntries(entries);
    return clone.valueOf();
  }
}

export interface StringMomentoApiKeyProviderProps
  extends CredentialProviderProps {
  /**
   * apiKey the momento API key
   */
  apiKey: string;
}

export interface StringMomentoAuthTokenProviderProps
  extends CredentialProviderProps {
  /**
   * authToken the momento auth token
   */
  authToken: string;
}

export type StringMomentoTokenProviderProps =
  | StringMomentoApiKeyProviderProps
  | StringMomentoAuthTokenProviderProps;

export type ApiKeyV2TokenProviderProps = StringMomentoTokenProviderProps & {
  endpoint: string;
};

export interface EnvVarV2TokenProviderProps {
  apiKeyEnvVar: string;
  endpointEnvVar: string;
}

/**
 * Reads and parses a momento auth token stored in a String
 * @export
 * @class StringMomentoTokenProvider
 * @deprecated use ApiKeyV2TokenProvider instead
 */
export class StringMomentoTokenProvider extends CredentialProviderBase {
  private readonly apiKey: string;
  private readonly allEndpoints: AllEndpoints;
  private readonly endpointsOverridden: boolean;

  /**
   * @param {StringMomentoTokenProviderProps} props configuration options for the token provider
   */
  constructor(props: StringMomentoTokenProviderProps | string) {
    if (typeof props === 'string') {
      props = {apiKey: props};
    }
    super();
    let key: string;
    if ('authToken' in props) {
      key = props.authToken;
    } else if ('apiKey' in props) {
      key = props.apiKey;
    } else {
      throw new Error('Missing required property: authToken or apiKey');
    }
    const decodedToken = decodeAuthToken(key);
    this.apiKey = decodedToken.authToken;
    if (props.endpointOverrides === undefined) {
      this.endpointsOverridden = false;
      if (decodedToken.controlEndpoint === undefined) {
        throw new Error(
          'Malformed token; unable to determine control endpoint.  Depending on the type of token you are using, you may need to specify the controlEndpoint explicitly.'
        );
      }
      if (decodedToken.cacheEndpoint === undefined) {
        throw new Error(
          'Malformed token; unable to determine cache endpoint.  Depending on the type of token you are using, you may need to specify the cacheEndpoint explicitly.'
        );
      }
      if (decodedToken.tokenEndpoint === undefined) {
        throw new Error(
          'Malformed token; unable to determine token endpoint.  Depending on the type of token you are using, you may need to specify the tokenEndpoint explicitly.'
        );
      }

      this.allEndpoints = {
        controlEndpoint: decodedToken.controlEndpoint,
        cacheEndpoint: decodedToken.cacheEndpoint,
        tokenEndpoint: decodedToken.tokenEndpoint,
      };
    } else if (isAllEndpoints(props.endpointOverrides)) {
      this.endpointsOverridden = true;
      this.allEndpoints = props.endpointOverrides;
    } else if (isBaseEndpointOverride(props.endpointOverrides)) {
      this.endpointsOverridden = true;
      this.allEndpoints = populateAllEndpointsFromBaseEndpoint(
        props.endpointOverrides
      );
    } else {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Unsupported endpointOverrides: ${props.endpointOverrides}`
      );
    }
  }

  getAuthToken(): string {
    return this.apiKey;
  }

  getCacheEndpoint(): string {
    return this.allEndpoints.cacheEndpoint;
  }
  isCacheEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  getControlEndpoint(): string {
    return this.allEndpoints.controlEndpoint;
  }

  isControlEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  getTokenEndpoint(): string {
    return this.allEndpoints.tokenEndpoint;
  }

  isTokenEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  isStorageEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  areEndpointsOverridden(): boolean {
    return this.endpointsOverridden;
  }

  isEndpointSecure(): boolean {
    if (this.allEndpoints.secureConnection === undefined) {
      return true;
    }
    return this.allEndpoints.secureConnection;
  }

  withMomentoLocal(): CredentialProvider {
    return new MomentoLocalProvider();
  }
}

export interface EnvMomentoTokenProviderProps extends CredentialProviderProps {
  /**
   * the name of the environment variable from which the auth token will be read
   */
  environmentVariableName: string;
}

/**
 * Reads and parses a momento auth token stored as an environment variable.
 * @export
 * @class EnvMomentoTokenProvider
 * @deprecated use EnvVarV2TokenProvider instead
 */
export class EnvMomentoTokenProvider extends StringMomentoTokenProvider {
  environmentVariableName: string;
  /**
   * @param {EnvMomentoTokenProviderProps} props configuration options for the token provider
   */
  constructor(props: EnvMomentoTokenProviderProps | string) {
    if (typeof props === 'string') {
      props = {environmentVariableName: props};
    }
    const authToken = process.env[props.environmentVariableName];
    if (!authToken) {
      throw new Error(
        `Missing required environment variable ${props.environmentVariableName}`
      );
    }
    super({
      authToken: authToken,
      endpointOverrides: props.endpointOverrides,
    });
    this.environmentVariableName = props.environmentVariableName;
  }
}

export function getDefaultCredentialProvider(): CredentialProvider {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return CredentialProvider.fromEnvVar('MOMENTO_API_KEY');
}

export interface MomentoLocalProviderProps extends CredentialProviderProps {
  /**
   * The hostname of the momento-local service
   */
  hostname?: string;
  /**
   * The port of the momento-local service
   */
  port?: number;
}

export class MomentoLocalProvider implements CredentialProvider {
  private readonly allEndpoints: AllEndpoints;
  private readonly endpointsOverridden: boolean;

  /**
   * @param {MomentoLocalProviderProps} props configuration options for connecting to momento-local
   */
  constructor(props?: MomentoLocalProviderProps) {
    const hostname = props?.hostname || '127.0.0.1';
    const port = props?.port || 8080;
    const momentoLocalEndpoint = `${hostname}:${port}`;

    if (props === undefined || props.endpointOverrides === undefined) {
      this.endpointsOverridden = false;
      this.allEndpoints = {
        controlEndpoint: momentoLocalEndpoint,
        cacheEndpoint: momentoLocalEndpoint,
        tokenEndpoint: momentoLocalEndpoint,
        secureConnection: false,
      };
    } else if (isAllEndpoints(props.endpointOverrides)) {
      this.endpointsOverridden = true;
      this.allEndpoints = props.endpointOverrides;
    } else if (isBaseEndpointOverride(props.endpointOverrides)) {
      this.endpointsOverridden = true;
      this.allEndpoints = populateAllEndpointsFromBaseEndpoint(
        props.endpointOverrides
      );
    } else {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Unsupported endpointOverrides: ${props.endpointOverrides}`
      );
    }
  }

  getAuthToken(): string {
    return '';
  }

  getCacheEndpoint(): string {
    return this.allEndpoints.cacheEndpoint;
  }

  isCacheEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  getControlEndpoint(): string {
    return this.allEndpoints.controlEndpoint;
  }

  isControlEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  getTokenEndpoint(): string {
    return this.allEndpoints.tokenEndpoint;
  }

  isTokenEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  areEndpointsOverridden(): boolean {
    return this.endpointsOverridden;
  }

  isEndpointSecure(): boolean {
    if (this.allEndpoints.secureConnection === undefined) {
      return true;
    }
    return this.allEndpoints.secureConnection;
  }

  withMomentoLocal(): CredentialProvider {
    return new MomentoLocalProvider();
  }
}

export class ApiKeyV2TokenProvider extends CredentialProviderBase {
  private readonly apiKey: string;
  private readonly allEndpoints: AllEndpoints;

  /**
   * @param {ApiKeyV2TokenProviderProps} props configuration options for the token provider
   */
  constructor(props: ApiKeyV2TokenProviderProps) {
    super();
    let key: string;
    if ('authToken' in props) {
      key = props.authToken;
    } else if ('apiKey' in props) {
      key = props.apiKey;
    } else {
      throw new Error('Missing required property: authToken or apiKey');
    }
    if (!key.length) {
      throw new Error('API key cannot be an empty string');
    }
    if (!isV2ApiKey(key)) {
      throw new Error(
        'Received an invalid v2 API key. Are you using the correct key? Or did you mean to use `fromString()` with a legacy key instead?'
      );
    }

    let endpoint: string;
    if ('endpoint' in props) {
      endpoint = props.endpoint;
    } else {
      throw new Error('Missing required property: endpoint');
    }
    if (!endpoint.length) {
      throw new Error('Endpoint cannot be an empty string');
    }

    this.apiKey = key;
    this.allEndpoints = {
      controlEndpoint: 'control.' + endpoint,
      cacheEndpoint: 'cache.' + endpoint,
      tokenEndpoint: 'token.' + endpoint,
    };
  }

  getAuthToken(): string {
    return this.apiKey;
  }

  getCacheEndpoint(): string {
    return this.allEndpoints.cacheEndpoint;
  }
  isCacheEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  getControlEndpoint(): string {
    return this.allEndpoints.controlEndpoint;
  }

  isControlEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  getTokenEndpoint(): string {
    return this.allEndpoints.tokenEndpoint;
  }

  isTokenEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  isStorageEndpointSecure(): boolean {
    return this.isEndpointSecure();
  }

  areEndpointsOverridden(): boolean {
    return false;
  }

  isEndpointSecure(): boolean {
    if (this.allEndpoints.secureConnection === undefined) {
      return true;
    }
    return this.allEndpoints.secureConnection;
  }

  withMomentoLocal(): CredentialProvider {
    return new MomentoLocalProvider();
  }
}

export class EnvVarV2TokenProvider extends ApiKeyV2TokenProvider {
  /**
   * @param {EnvVarV2TokenProviderProps} props configuration options for the token provider
   */
  constructor(props: EnvVarV2TokenProviderProps) {
    if (!props.apiKeyEnvVar) {
      throw new Error('Missing required property: apiKeyEnvVar');
    }
    if (!props.endpointEnvVar) {
      throw new Error('Missing required property: endpointEnvVar');
    }
    if (!props.apiKeyEnvVar.length) {
      throw new Error(
        'API key environment variable name cannot be an empty string'
      );
    }
    if (!props.endpointEnvVar.length) {
      throw new Error(
        'Endpoint environment variable name cannot be an empty string'
      );
    }

    const endpoint = process.env[props.endpointEnvVar];
    if (!endpoint) {
      throw new Error(
        `Empty value for environment variable ${props.endpointEnvVar}`
      );
    }
    if (!endpoint.length) {
      throw new Error(
        `Endpoint environment variable ${props.endpointEnvVar} cannot be an empty string`
      );
    }

    const authToken = process.env[props.apiKeyEnvVar];
    if (!authToken) {
      throw new Error(
        `Empty value for environment variable ${props.apiKeyEnvVar}`
      );
    }
    if (!authToken.length) {
      throw new Error(
        `API key environment variable ${props.apiKeyEnvVar} cannot be an empty string`
      );
    }

    if (!isV2ApiKey(authToken)) {
      throw new Error(
        'Received an invalid v2 API key. Are you using the correct key? Or did you mean to use `fromEnvironmentVariable()` with a legacy key instead?'
      );
    }
    super({
      authToken: authToken,
      endpoint: endpoint,
    });
  }
}
