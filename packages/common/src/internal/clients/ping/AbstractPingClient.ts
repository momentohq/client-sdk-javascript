import {MomentoLogger, MomentoLoggerFactory} from '../../../config/logging';
import {IPingClient} from './IPingClient';

export interface BasePingConfiguration {
  /**
   * @returns {MomentoLoggerFactory} the current configuration options for logging verbosity and format
   */
  getLoggerFactory(): MomentoLoggerFactory;
}

export interface BasePingClientProps {
  configuration: BasePingConfiguration;
  createPingClient: () => IPingClient;
}

/**
 * Momento Cache Client.
 *
 * Features include:
 * - Get, set, and delete data
 * - Create, delete, and list caches
 * - Create, revoke, and list signing keys
 */
export abstract class AbstractPingClient implements IPingClient {
  private readonly logger: MomentoLogger;
  private readonly pingClient: IPingClient;

  /**
   * Creates an instance of CacheClient.
   */
  protected constructor(props: BasePingClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.debug('Creating Momento PingClient');

    this.pingClient = props.createPingClient();
  }

  /**
   * Simple ping api
   *
   * @returns {Promise<void>} -
   */
  public async ping(): Promise<void> {
    return await this.pingClient.ping();
  }
}
