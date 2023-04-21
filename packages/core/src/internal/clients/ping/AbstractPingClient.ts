import {IPingClient} from './IPingClient';

export interface BasePingClientProps {
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
  private readonly pingClient: IPingClient;

  /**
   * Creates an instance of CacheClient.
   */
  protected constructor(props: BasePingClientProps) {
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
