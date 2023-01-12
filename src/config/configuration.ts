import {TransportStrategy} from './transport/transport-strategy';

export interface SimpleCacheConfiguration {
  // TODO: add RetryStrategy
  // TODO: add Middlewares
  getTransportStrategy(): TransportStrategy;
  withTransportStrategy(
    transportStrategy: TransportStrategy
  ): SimpleCacheConfiguration;
  getMaxIdleMillis(): number;
  withMaxIdleMillis(maxIdleMillis: number): SimpleCacheConfiguration;
  withClientTimeout(clientTimeout: number): SimpleCacheConfiguration;
}

export class Configuration implements SimpleCacheConfiguration {
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

  withTransportStrategy(
    transportStrategy: TransportStrategy
  ): SimpleCacheConfiguration {
    return new Configuration(transportStrategy, this.maxIdleMillis);
  }

  withMaxIdleMillis(maxIdleMillis: number) {
    return new Configuration(this.transportStrategy, maxIdleMillis);
  }

  withClientTimeout(clientTimeout: number): SimpleCacheConfiguration {
    return new Configuration(
      this.transportStrategy.withClientTimeout(clientTimeout),
      this.maxIdleMillis
    );
  }
}
