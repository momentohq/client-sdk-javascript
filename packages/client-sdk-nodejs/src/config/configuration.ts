import {RetryStrategy} from './retry/retry-strategy';
import {
  Middleware,
  MiddlewareRequestHandlerContext,
} from './middleware/middleware';
import {MomentoLoggerFactory} from '../';
import {TransportStrategy} from './transport';

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
  /**
   * Configures context available to each unique request handler of the middleware
   */
  middlewareRequestHandlerContext?: MiddlewareRequestHandlerContext;
}

/**
 * Configuration options for Momento CacheClient.
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
   * Copy constructor for overriding MiddlewareRequestHandlerContext
   * @param {MiddlewareRequestHandlerContext} context
   * @returns {Configuration} a new Configuration object with the specified MiddlewareRequestHandlerContext
   */
  withMiddlewareRequestHandlerContext(
    context: MiddlewareRequestHandlerContext
  ): Configuration;

  /**
   * Copy constructor that adds a single middleware request context to the existing context
   * @param {string} key the key for the context
   * @param value the value for the context that can be a string, number, or boolean
   * @returns {Configuration} a new Configuration object with the specified Middleware appended to the list of existing Middlewares
   */
  addToMiddlewareRequestHandlerContext(
    key: string,
    value: string | number | boolean
  ): Configuration;

  /**
   * @returns {MiddlewareRequestHandlerContext} the middleware request handler context. Can be undefined
   * */
  getMiddlewareRequestHandlerContext():
    | MiddlewareRequestHandlerContext
    | undefined;

  /**
   * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
   * @param {number} clientTimeoutMillis
   * @returns {Configuration} a new Configuration object with its TransportStrategy updated to use the specified client timeout
   */
  withClientTimeoutMillis(clientTimeoutMillis: number): Configuration;
}

export class CacheConfiguration implements Configuration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly retryStrategy: RetryStrategy;
  private readonly transportStrategy: TransportStrategy;
  private readonly middlewares: Middleware[];
  private middlewareRequestHandlerContext?: MiddlewareRequestHandlerContext;

  constructor(props: ConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.retryStrategy = props.retryStrategy;
    this.transportStrategy = props.transportStrategy;
    this.middlewares = props.middlewares;
    this.middlewareRequestHandlerContext =
      props.middlewareRequestHandlerContext;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getRetryStrategy(): RetryStrategy {
    return this.retryStrategy;
  }

  withRetryStrategy(retryStrategy: RetryStrategy): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      middlewareRequestHandlerContext: this.middlewareRequestHandlerContext,
    });
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new CacheConfiguration({
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
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: middlewares,
      middlewareRequestHandlerContext: this.middlewareRequestHandlerContext,
    });
  }

  withMiddlewareRequestHandlerContext(
    context: MiddlewareRequestHandlerContext
  ): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      middlewareRequestHandlerContext: context,
    });
  }

  getMiddlewareRequestHandlerContext():
    | MiddlewareRequestHandlerContext
    | undefined {
    return this.middlewareRequestHandlerContext;
  }

  addToMiddlewareRequestHandlerContext(
    key: string,
    value: string | number | boolean
  ): Configuration {
    if (this.middlewareRequestHandlerContext === undefined) {
      this.middlewareRequestHandlerContext = {};
    }
    this.middlewareRequestHandlerContext[key] = value;
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
      middlewareRequestHandlerContext: this.middlewareRequestHandlerContext,
    });
  }

  addMiddleware(middleware: Middleware): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: [middleware, ...this.middlewares],
      middlewareRequestHandlerContext: this.middlewareRequestHandlerContext,
    });
  }

  withClientTimeoutMillis(clientTimeout: number): Configuration {
    return new CacheConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeout),
      middlewares: this.middlewares,
      middlewareRequestHandlerContext: this.middlewareRequestHandlerContext,
    });
  }
}
