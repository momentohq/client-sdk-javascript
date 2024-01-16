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
}

export class LeaderboardClientConfiguration
  implements LeaderboardConfiguration
{
  private readonly loggerFactory: MomentoLoggerFactory;
  private readonly transportStrategy: TransportStrategy;
  private readonly throwOnErrors: boolean;

  constructor(props: LeaderboardConfigurationProps) {
    this.loggerFactory = props.loggerFactory;
    this.transportStrategy = props.transportStrategy;
    this.throwOnErrors = props.throwOnErrors;
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
    });
  }

  withTransportStrategy(
    transportStrategy: TransportStrategy
  ): LeaderboardConfiguration {
    return new LeaderboardClientConfiguration({
      loggerFactory: this.loggerFactory,
      transportStrategy: transportStrategy,
      throwOnErrors: this.throwOnErrors,
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
    });
  }
}
