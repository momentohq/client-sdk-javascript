import {Configuration} from './configuration';
import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {TransportStrategy} from './transport';

export interface VectorConfigurationProps {
  /**
   * Configures logging verbosity and format
   */
  loggerFactory: MomentoLoggerFactory;

  /**
   * Configures low-level options for network interactions with the Momento service
   */
  transportStrategy: TransportStrategy;
}

export class VectorConfiguration implements Configuration {
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: TransportStrategy;

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
    });
  }

  withTransportStrategy(transportStrategy: TransportStrategy): Configuration {
    return new VectorConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
    });
  }
}
