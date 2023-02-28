import {TransportStrategy} from './transport/transport-strategy';
import {MomentoLoggerFactory} from './logging/momento-logger';
import {RetryStrategy} from './retry/retry-strategy';
import {Middleware} from './middleware/middleware';

export interface ConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
  /**
   * Configures how and when failed requests will be retried
   */
  retryStrategy: RetryStrategy;
  /**
   * Configures low-level options for network interactions with the Momento service
   */
  transportStrategy: TransportStrategy;
  /**
   * Configures middleware functions that will wrap each request
   */
  middlewares: Middleware[];
}

/**
 * Configuration options for Momento Simple Cache client.
 *
 * @export
 * @interface Configuration
 */
export interface Configuration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;

  /**
   * @returns {RetryStrategy} the current configuration options for how and when failed requests will be retried
   */
  getRetryStrategy(): RetryStrategy;

  /**
   * Copy constructor for overriding RetryStrategy
   * @param {RetryStrategy} retryStrategy
   * @returns {Configuration} a new Configuration object with the specified RetryStrategy
   */
  withRetryStrategy(retryStrategy: RetryStrategy): Configuration;

  /**
   * @returns {TransportStrategy} the current configuration options for wire interactions with the Momento service
   */
  getTransportStrategy(): TransportStrategy;

  /**
   * Copy constructor for overriding TransportStrategy
   * @param {TransportStrategy} transportStrategy
   * @returns {Configuration} a new Configuration object with the specified TransportStrategy
   */
  withTransportStrategy(transportStrategy: TransportStrategy): Configuration;

  /**
   * @returns {Middleware[]} the middleware functions that will wrap each request
   */
  getMiddlewares(): Middleware[];

  /**
   * Copy constructor for overriding Middlewares
   * @param {Middleware[]} middlewares
   * @returns {Configuration} a new Configuration object with the specified Middlewares
   */
  withMiddlewares(middlewares: Middleware[]): Configuration;

  /**
   * Copy constructor that adds a single middleware to the existing middlewares
   * @param {Middleware} middleware
   * @returns {Configuration} a new Configuration object with the specified Middleware appended to the list of existing Middlewares
   */
  addMiddleware(middleware: Middleware): Configuration;

  /**
   * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
   * @param {number} clientTimeoutMillis
   * @returns {Configuration} a new Configuration object with its TransportStrategy updated to use the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): Configuration;
}

export class SimpleCacheConfiguration implements Configuration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly retryStrategy: RetryStrategy;
  private readonly transportStrategy: TransportStrategy;
  private readonly middlewares: Middleware[];

  constructor(props: ConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.retryStrategy = props.retryStrategy;
    this.transportStrategy = props.transportStrategy;
    this.middlewares = props.middlewares;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getRetryStrategy(): RetryStrategy {
    return this.retryStrategy;
  }

  withRetryStrategy(retryStrategy: RetryStrategy): Configuration {
    return new SimpleCacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
    });
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new SimpleCacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: transportStrategy,
      middlewares: this.middlewares,
    });
  }

  getMiddlewares(): Middleware[] {
    return this.middlewares;
  }

  withMiddlewares(middlewares: Middleware[]): Configuration {
    return new SimpleCacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: middlewares,
    });
  }

  addMiddleware(middleware: Middleware): Configuration {
    return new SimpleCacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: [middleware, ...this.middlewares],
    });
  }

  withClientTimeoutMillis(clientTimeout: number): Configuration {
    return new SimpleCacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeout),
      middlewares: this.middlewares,
    });
  }
}
