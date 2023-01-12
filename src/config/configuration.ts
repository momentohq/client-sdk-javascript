import {TransportStrategy} from './transport/transport-strategy';
import {LoggerOptions} from '../utils/logging';

export interface Configuration {
  // TODO: add RetryStrategy
  // TODO: add Middlewares
  getLoggerOptions(): LoggerOptions;
  withLoggerOptions(loggerOptions: LoggerOptions): Configuration;
  getTransportStrategy(): TransportStrategy;
  withTransportStrategy(transportStrategy: TransportStrategy): Configuration;
  getMaxIdleMillis(): number;
  withMaxIdleMillis(maxIdleMillis: number): Configuration;
  withClientTimeout(clientTimeout: number): Configuration;
}

export class SimpleCacheConfiguration implements Configuration {
  private readonly loggerOptions: LoggerOptions;
  private readonly transportStrategy: TransportStrategy;
  private readonly maxIdleMillis: number;

  constructor(
    loggerOptions: LoggerOptions,
    transportStrategy: TransportStrategy,
    maxIdleMillis: number
  ) {
    this.loggerOptions = loggerOptions;
    this.transportStrategy = transportStrategy;
    this.maxIdleMillis = maxIdleMillis;
  }

  getLoggerOptions(): LoggerOptions {
    return this.loggerOptions;
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  getMaxIdleMillis(): number {
    return this.maxIdleMillis;
  }

  withLoggerOptions(loggerOptions: LoggerOptions): Configuration {
    return new SimpleCacheConfiguration(
      loggerOptions,
      this.transportStrategy,
      this.maxIdleMillis
    );
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new SimpleCacheConfiguration(
      this.loggerOptions,
      transportStrategy,
      this.maxIdleMillis
    );
  }

  withMaxIdleMillis(maxIdleMillis: number) {
    return new SimpleCacheConfiguration(
      this.loggerOptions,
      this.transportStrategy,
      maxIdleMillis
    );
  }

  withClientTimeout(clientTimeout: number): Configuration {
    return new SimpleCacheConfiguration(
      this.loggerOptions,
      this.transportStrategy.withClientTimeout(clientTimeout),
      this.maxIdleMillis
    );
  }
}
