import {MomentoLoggerFactory} from '../';
import {Middleware} from './middleware/middleware';
import {StorageTransportStrategy} from './transport/storage';

/**
 * Configuration options for Momento StorageClient
 *
 * @export
 * @interface StorageConfiguration
 */
export interface StorageConfiguration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;

  /**
   * @returns {StorageTransportStrategy} the current configuration options for wire interactions with the Momento service
   */
  getTransportStrategy(): StorageTransportStrategy;

  /**
   * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
   * @param {number} clientTimeoutMillis
   * @returns {StorageConfiguration} a new Configuration object with its TransportStrategy updated to use the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): StorageConfiguration;

  /**
   * Copy constructor for overriding TransportStrategy
   * @param {StorageTransportStrategy} transportStrategy
   * @returns {Configuration} a new Configuration object with the specified TransportStrategy
   */
  withTransportStrategy(
    transportStrategy: StorageTransportStrategy
  ): StorageConfiguration;

  /**
   * @returns {Middleware[]} the middleware functions that will wrap each request
   */
  getMiddlewares(): Middleware[];

  /**
   * Copy constructor for overriding Middlewares
   * @param {Middleware[]} middlewares
   * @returns {Configuration} a new Configuration object with the specified Middlewares
   */
  withMiddlewares(middlewares: Middleware[]): StorageConfiguration;

  /**
   * Copy constructor that adds a single middleware to the existing middlewares
   * @param {Middleware} middleware
   * @returns {Configuration} a new Configuration object with the specified Middleware appended to the list of existing Middlewares
   */
  addMiddleware(middleware: Middleware): StorageConfiguration;

  /**
   * @returns {boolean} Configures whether the client should return a Momento Error object or throw an exception when an
   * error occurs. By default, this is set to false, and the client will return a Momento Error object on errors. Set it
   * to true if you prefer for exceptions to be thrown.
   */
  getThrowOnErrors(): boolean;

  /**
   * Copy constructor for configuring whether the client should return a Momento Error object or throw an exception when an
   * error occurs. By default, this is set to false, and the client will return a Momento Error object on errors. Set it
   * to true if you prefer for exceptions to be thrown.
   * @param {boolean} throwOnErrors
   * @returns {Configuration} a new Configuration object with the specified throwOnErrors setting
   */
  withThrowOnErrors(throwOnErrors: boolean): StorageConfiguration;
}

export interface StorageConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
  /**
   * Configures low-level options for network interactions with the Momento service
   */
  transportStrategy: StorageTransportStrategy;

  /**
   * Configures middleware functions that will wrap each request
   */
  middlewares: Middleware[];

  /**
   * Configures whether the client should return a Momento Error object or throw an exception when an error occurs.
   */
  throwOnErrors: boolean;
}

export class StorageClientConfiguration implements StorageConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: StorageTransportStrategy;
  private readonly middlewares: Middleware[];
  private readonly throwOnErrors: boolean;

  constructor(props: StorageConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
    this.middlewares = props.middlewares;
    this.throwOnErrors = props.throwOnErrors;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getTransportStrategy(): StorageTransportStrategy {
    return this.transportStrategy;
  }

  withClientTimeoutMillis(clientTimeoutMillis: number): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeoutMillis),
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
    });
  }

  withTransportStrategy(
    transportStrategy: StorageTransportStrategy
  ): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: this.throwOnErrors,
    });
  }

  getMiddlewares(): Middleware[] {
    return this.middlewares;
  }

  withMiddlewares(middlewares: Middleware[]): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      middlewares: middlewares,
      throwOnErrors: this.throwOnErrors,
    });
  }

  addMiddleware(middleware: Middleware): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      middlewares: [middleware, ...this.middlewares],
      throwOnErrors: this.throwOnErrors,
    });
  }

  withThrowOnErrors(throwOnErrors: boolean): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      throwOnErrors: throwOnErrors,
    });
  }

  getThrowOnErrors(): boolean {
    return this.throwOnErrors;
  }
}
