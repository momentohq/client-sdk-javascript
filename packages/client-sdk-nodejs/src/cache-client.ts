import {ControlClient} from './internal/control-client';
import {DataClient} from './internal/data-client';
import {
  CreateSigningKey,
  ListSigningKeys,
  RevokeSigningKey,
  CacheFlush,
  MomentoLogger,
} from '.';
import {CacheClientProps} from './cache-client-props';
import {range} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {AbstractCacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache/AbstractCacheClient';

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
    const dataClients = range(numClients).map(() => new DataClient(props));
    super(controlClient, dataClients);

    this.notYetAbstractedControlClient = controlClient;

    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.info('Creating Momento CacheClient');
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
