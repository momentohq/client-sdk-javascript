import {Configuration} from './configuration';
import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {TransportStrategy} from './transport';
import {Middleware} from './middleware/middleware';
import {RetryStrategy} from './retry/retry-strategy';

export interface VectorConfigurationProps {
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

export class VectorConfiguration implements Configuration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly retryStrategy: RetryStrategy;
  private readonly transportStrategy: TransportStrategy;
  private readonly middlewares: Middleware[];

  constructor(props: VectorConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
  }

  getLoggerFactory(): MomentoLoggerFactory {
    return this.loggerFactory;
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  withClientTimeoutMillis(clientTimeoutMillis: number): Configuration {
    return new VectorConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy:
        this.transportStrategy.withClientTimeoutMillis(clientTimeoutMillis),
      retryStrategy: this.retryStrategy,
      middlewares: this.middlewares,
    });
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new VectorConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
      retryStrategy: this.retryStrategy,
      middlewares: this.middlewares,
    });
  }

  addMiddleware(middleware: Middleware): Configuration {
    return new VectorConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: [middleware, ...this.middlewares],
    });
  }

  getMiddlewares(): Middleware[] {
    return this.middlewares;
  }

  getRetryStrategy(): RetryStrategy {
    return this.retryStrategy;
  }

  withMiddlewares(middlewares: Middleware[]): Configuration {
    return new VectorConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: this.retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: middlewares,
    });
  }

  withRetryStrategy(retryStrategy: RetryStrategy): Configuration {
    return new VectorConfiguration({
      loggerFactory: this.loggerFactory,
      retryStrategy: retryStrategy,
      transportStrategy: this.transportStrategy,
      middlewares: this.middlewares,
    });
  }
}
