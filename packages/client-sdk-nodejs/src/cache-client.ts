import {ControlClient} from './internal/control-client';
import {DataClient} from './internal/data-client';
import {
  CreateSigningKey,
  ListSigningKeys,
  RevokeSigningKey,
  CacheFlush,
  MomentoLogger,
} from '.';
import {CacheClientProps, EagerCacheClientProps} from './cache-client-props';
import {
  range,
  validateTimeout,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {AbstractCacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache/AbstractCacheClient';

const EAGER_CONNECTION_DEFAULT_TIMEOUT_SECONDS = 30;
/**
 * Momento Cache Client.
 *
 * Features include:
 * - Get, set, and delete data
 * - Create, delete, and list caches
 * - Create, revoke, and list signing keys
 */
export class CacheClient extends AbstractCacheClient implements ICacheClient {
  private readonly logger: MomentoLogger;
  private readonly notYetAbstractedControlClient: ControlClient;
  /**
   * Creates an instance of CacheClient.
   * @param {CacheClientProps} props configuration and credentials for creating a CacheClient.
   */
  constructor(props: CacheClientProps) {
    const controlClient = new ControlClient({
      configuration: props.configuration,
      credentialProvider: props.credentialProvider,
    });

    const numClients = props.configuration
      .getTransportStrategy()
      .getGrpcConfig()
      .getNumClients();
    const dataClients = range(numClients).map(
      (_, id) => new DataClient(props, String(id))
    );
    super(controlClient, dataClients);

    this.notYetAbstractedControlClient = controlClient;

    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.debug('Creating Momento CacheClient');
  }

  /**
   * Creates a new instance of CacheClient. If eagerConnectTimeout is present in the given props, the client will
   * eagerly create its connection to Momento. It will wait until the connection is established, or until the timout
   * runs out. It the timeout runs out, the client will be valid to use, but it may still be connecting in the background.
   * @param {EagerCacheClientProps} props configuration and credentials for creating a CacheClient.
   */
  static async create(props: EagerCacheClientProps): Promise<CacheClient> {
    const client = new CacheClient(props);
    const timeout =
      props.eagerConnectTimeout !== undefined
        ? props.eagerConnectTimeout
        : EAGER_CONNECTION_DEFAULT_TIMEOUT_SECONDS;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    validateTimeout(timeout);
    // client need to explicitly set the value as 0 to disable eager connection.
    if (props.eagerConnectTimeout !== 0) {
      await Promise.all(
        client.dataClients.map(dc => (dc as DataClient).connect(timeout))
      );
    }
    return client;
  }

  /**
   * Flushes / clears all the items of the given cache
   *
   * @param {string} cacheName - The cache to be flushed.
   * @returns {Promise<CacheFlush.Response>} -
   * {@link CacheFlush.Success} on success.
   * {@link CacheFlush.Error} on failure.
   */
  public async flushCache(cacheName: string): Promise<CacheFlush.Response> {
    return await this.notYetAbstractedControlClient.flushCache(cacheName);
  }

  /**
   * Creates a Momento signing key.
   *
   * @param {number} ttlMinutes - The time to live in minutes until the Momento
   * signing key expires.
   * @returns {Promise<CreateSigningKey.Response>} -
   * {@link CreateSigningKey.Success} containing the key, key ID, endpoint, and
   * expiration date on success.
   * {@link CreateSigningKey.Error} on failure.
   */
  public async createSigningKey(
    ttlMinutes: number
  ): Promise<CreateSigningKey.Response> {
    const client = this.getNextDataClient();
    return await this.notYetAbstractedControlClient.createSigningKey(
      ttlMinutes,
      client.getEndpoint()
    );
  }

  /**
   * Revokes a Momento signing key.
   *
   * @remarks
   * All tokens signed by this key will be invalid.
   *
   * @param {string} keyId - The ID of the key to revoke.
   * @returns {Promise<RevokeSigningKey.Response>} -
   * {@link RevokeSigningKey.Success} on success.
   * {@link RevokeSigningKey.Error} on failure.
   */
  public async revokeSigningKey(
    keyId: string
  ): Promise<RevokeSigningKey.Response> {
    return await this.notYetAbstractedControlClient.revokeSigningKey(keyId);
  }

  /**
   * Lists all Momento signing keys for the provided auth token.
   *
   * @returns {Promise<ListSigningKeys.Response>} -
   * {@link ListSigningKeys.Success} containing the keys on success.
   * {@link ListSigningKeys.Error} on failure.
   */
  public async listSigningKeys(): Promise<ListSigningKeys.Response> {
    const client = this.getNextDataClient();
    return await this.notYetAbstractedControlClient.listSigningKeys(
      client.getEndpoint()
    );
  }

  protected getNextDataClient(): DataClient {
    const client = this.dataClients[this.nextDataClientIndex];
    this.nextDataClientIndex =
      (this.nextDataClientIndex + 1) % this.dataClients.length;
    return client as DataClient;
  }
}

/**
 * @deprecated use {CacheClient} instead
 */
export class SimpleCacheClient extends CacheClient {}
