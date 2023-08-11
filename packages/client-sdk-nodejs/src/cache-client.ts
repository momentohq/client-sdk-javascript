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

    // For high load, we get better performance with multiple clients.  Here we
    // are setting a default, hard-coded value for the number of clients to use,
    // because we haven't yet designed the API for users to use to configure
    // tunables:
    // https://github.com/momentohq/dev-eco-issue-tracker/issues/85
    // The choice of 6 as the initial value is a rough guess at a reasonable
    // default for the short-term, based on load testing results captured in:
    // https://github.com/momentohq/oncall-tracker/issues/186
    const numClients = 6;
    const dataClients = range(numClients).map(() => new DataClient(props));
    super(controlClient, dataClients);

    this.notYetAbstractedControlClient = controlClient;

    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.info('Creating Momento CacheClient');
  }

  /**
   * Creates a new instance of CacheClient that eagerly creates its connections to Momento. By default, connections are
   * created lazily when the client is first used. If connections cannot be established, an error will be logged and
   * execution will resume.
   */
  static async createWithEagerConnections(
    props: CacheClientProps
  ): Promise<CacheClient> {
    const client = new CacheClient(props);
    await Promise.all(
      client.dataClients.map(dc => (dc as DataClient).connect())
    );
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
