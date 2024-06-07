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
}

export class StorageClientConfiguration implements StorageConfiguration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: StorageTransportStrategy;
  private readonly middlewares: Middleware[];

  constructor(props: StorageConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
    this.middlewares = props.middlewares;
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
    });
  }

  withTransportStrategy(
    transportStrategy: StorageTransportStrategy
  ): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
      middlewares: this.middlewares,
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
    });
  }

  addMiddleware(middleware: Middleware): StorageConfiguration {
    return new StorageClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      middlewares: [middleware, ...this.middlewares],
    });
  }
}
