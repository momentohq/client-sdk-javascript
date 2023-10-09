import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {TransportStrategy} from './transport';

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
   * Copy constructor for overriding TransportStrategy
   * @param {TransportStrategy} transportStrategy
   * @returns {Configuration} a new Configuration object with the specified TransportStrategy
   */
  withTransportStrategy(
    transportStrategy: TransportStrategy
  ): LeaderboardConfiguration;
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
}

export class LeaderboardClientConfiguration
  implements LeaderboardConfiguration
{
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: TransportStrategy;

  constructor(props: LeaderboardConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
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
    });
  }

  withTransportStrategy(
    transportStrategy: TransportStrategy
  ): LeaderboardConfiguration {
    return new LeaderboardClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
    });
  }
}
