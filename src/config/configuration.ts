import {ITransportStrategy} from './transport/transport-strategy';

export interface IConfiguration {
  // TODO: add RetryStrategy
  // TODO: add Middlewares
  getTransportStrategy(): ITransportStrategy;
  withTransportStrategy(transportStrategy: ITransportStrategy): IConfiguration;
  getMaxIdleMillis(): number;
  withMaxIdleMillis(maxIdleMillis: number): IConfiguration;
  withClientTimeout(clientTimeout: number): IConfiguration;
}

export class Configuration implements IConfiguration {
  private readonly transportStrategy: ITransportStrategy;
  private readonly maxIdleMillis: number;

  constructor(transportStrategy: ITransportStrategy, maxIdleMillis: number) {
    this.transportStrategy = transportStrategy;
    this.maxIdleMillis = maxIdleMillis;
  }

  getTransportStrategy(): ITransportStrategy {
    return this.transportStrategy;
  }

  getMaxIdleMillis(): number {
    return this.maxIdleMillis;
  }

  withTransportStrategy(transportStrategy: ITransportStrategy): IConfiguration {
    return new Configuration(transportStrategy, this.maxIdleMillis);
  }

  withMaxIdleMillis(maxIdleMillis: number) {
    return new Configuration(this.transportStrategy, maxIdleMillis);
  }

  withClientTimeout(clientTimeout: number): IConfiguration {
    return new Configuration(
      this.transportStrategy.withClientTimeout(clientTimeout),
      this.maxIdleMillis
    );
  }
}
