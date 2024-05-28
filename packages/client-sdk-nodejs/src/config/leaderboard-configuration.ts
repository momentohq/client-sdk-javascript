import {MomentoLoggerFactory, TransportStrategy} from '../';
import {Middleware} from './middleware/middleware';

/**
 * Configuration options for Momento LeaderboardClient
 *
 * @export
 * @interface LeaderboardConfiguration
 */
export interface LeaderboardConfiguration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;

  /**
   * @returns {TransportStrategy} the current configuration options for wire interactions with the Momento service
   */
  getTransportStrategy(): TransportStrategy;

  /**
   * Convenience copy constructor that updates the client-side timeout setting in the TransportStrategy
   * @param {number} clientTimeoutMillis
   * @returns {LeaderboardConfiguration} a new Configuration object with its TransportStrategy updated to use the specified client timeout
   */
  withClientTimeoutMillis(
    clientTimeoutMillis: number
  ): LeaderboardConfiguration;

  /**
   * Copy constructor for overriding TransportStrategy
   * @param {TransportStrategy} transportStrategy
   * @returns {Configuration} a new Configuration object with the specified TransportStrategy
   */
  withTransportStrategy(
    transportStrategy: TransportStrategy
  ): LeaderboardConfiguration;

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
  withThrowOnErrors(throwOnErrors: boolean): LeaderboardConfiguration;

  /**
   * @returns {Middleware[]} the middleware functions that will wrap each request
   */
  getMiddlewares(): Middleware[];

  /**
   * Copy constructor for overriding Middlewares
   * @param {Middleware[]} middlewares
   * @returns {Configuration} a new Configuration object with the specified Middlewares
   */
  withMiddlewares(middlewares: Middleware[]): LeaderboardConfiguration;

  /**
   * Copy constructor that adds a single middleware to the existing middlewares
   * @param {Middleware} middleware
   * @returns {Configuration} a new Configuration object with the specified Middleware appended to the list of existing Middlewares
   */
  addMiddleware(middleware: Middleware): LeaderboardConfiguration;
}

export interface LeaderboardConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;
  /**
   * Configures low-level options for network interactions with the Momento service
   */
  transportStrategy: TransportStrategy;

  /**
   * Configures whether the client should return a Momento Error object or throw an exception when an error occurs.
   */
  throwOnErrors: boolean;

  /**
   * Configures middleware functions that will wrap each request
   */
  middlewares: Middleware[];
}

export class LeaderboardClientConfiguration
  implements LeaderboardConfiguration
{
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: TransportStrategy;
  private readonly throwOnErrors: boolean;
  private readonly middlewares: Middleware[];

  constructor(props: LeaderboardConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
    this.throwOnErrors = props.throwOnErrors;
    this.middlewares = props.middlewares;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  withClientTimeoutMillis(
    clientTimeoutMillis: number
  ): LeaderboardConfiguration {
    return new LeaderboardClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeoutMillis),
      throwOnErrors: this.throwOnErrors,
      middlewares: this.middlewares,
    });
  }

  withTransportStrategy(
    transportStrategy: TransportStrategy
  ): LeaderboardConfiguration {
    return new LeaderboardClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
      throwOnErrors: this.throwOnErrors,
      middlewares: this.middlewares,
    });
  }

  getThrowOnErrors(): boolean {
    return this.throwOnErrors;
  }

  withThrowOnErrors(throwOnErrors: boolean): LeaderboardConfiguration {
    return new LeaderboardClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      throwOnErrors: throwOnErrors,
      middlewares: this.middlewares,
    });
  }

  getMiddlewares(): Middleware[] {
    return this.middlewares;
  }

  withMiddlewares(middlewares: Middleware[]): LeaderboardConfiguration {
    return new LeaderboardClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      middlewares: middlewares,
      throwOnErrors: this.throwOnErrors,
    });
  }

  addMiddleware(middleware: Middleware): LeaderboardConfiguration {
    return new LeaderboardClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: this.transportStrategy,
      middlewares: [middleware, ...this.middlewares],
      throwOnErrors: this.throwOnErrors,
    });
  }
}
