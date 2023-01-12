import {TransportStrategy} from './transport/transport-strategy';

export interface Configuration {
  // TODO: add RetryStrategy
  // TODO: add Middlewares
  getTransportStrategy(): TransportStrategy;
  withTransportStrategy(transportStrategy: TransportStrategy): Configuration;
  getMaxIdleMillis(): number;
  withMaxIdleMillis(maxIdleMillis: number): Configuration;
  withClientTimeout(clientTimeout: number): Configuration;
}

export class SimpleCacheConfiguration implements Configuration {
  private readonly transportStrategy: TransportStrategy;
  private readonly maxIdleMillis: number;

  constructor(transportStrategy: TransportStrategy, maxIdleMillis: number) {
    this.transportStrategy = transportStrategy;
    this.maxIdleMillis = maxIdleMillis;
  }

  getTransportStrategy(): TransportStrategy {
    return this.transportStrategy;
  }

  getMaxIdleMillis(): number {
    return this.maxIdleMillis;
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new SimpleCacheConfiguration(transportStrategy, this.maxIdleMillis);
  }

  withMaxIdleMillis(maxIdleMillis: number) {
    return new SimpleCacheConfiguration(this.transportStrategy, maxIdleMillis);
  }

  withClientTimeout(clientTimeout: number): Configuration {
    return new SimpleCacheConfiguration(
      this.transportStrategy.withClientTimeout(clientTimeout),
      this.maxIdleMillis
    );
  }
}
