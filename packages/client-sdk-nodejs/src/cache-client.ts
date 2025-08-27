import {CacheControlClient} from './internal/cache-control-client';
import {CacheDataClient} from './internal/cache-data-client';
import {CacheFlush, MomentoLogger, Configuration, Configurations} from '.';
import {CacheClientProps, EagerCacheClientProps} from './cache-client-props';
import {
  range,
  Semaphore,
  validateMaxConcurrentRequests,
  validateTimeout,
  validateTtlSeconds,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {ICacheClient} from '@gomomento/sdk-core/dist/src/clients/ICacheClient';
import {AbstractCacheClient} from '@gomomento/sdk-core/dist/src/internal/clients/cache/AbstractCacheClient';
import {CacheClientAllProps} from './internal/cache-client-all-props';
import {getDefaultCredentialProvider} from '@gomomento/sdk-core';
import {ControlCallOptions} from '@gomomento/sdk-core/dist/src/internal/clients';

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
  private readonly notYetAbstractedControlClient: CacheControlClient;
  private readonly _configuration: Configuration;
  private dataRequestConcurrencySemaphore: Semaphore | undefined = undefined;

  /**
   * Creates an instance of CacheClient.
   * @param {CacheClientProps} props configuration and credentials for creating a CacheClient.
   */
  constructor(props: CacheClientProps) {
    validateTtlSeconds(props.defaultTtlSeconds);
    const configuration: Configuration =
      props.configuration ?? getDefaultCacheClientConfiguration();
    const credentialProvider =
      props.credentialProvider ?? getDefaultCredentialProvider();

    const allProps: CacheClientAllProps = {
      ...props,
      configuration: configuration,
      credentialProvider: credentialProvider,
    };

    let semaphore: Semaphore | undefined = undefined;
    const numConcurrentRequests = configuration
      .getTransportStrategy()
      .getGrpcConfig()
      .getMaxConcurrentRequests();
    if (numConcurrentRequests !== null && numConcurrentRequests !== undefined) {
      validateMaxConcurrentRequests(numConcurrentRequests);
      semaphore = new Semaphore(numConcurrentRequests);
    }

    const controlClient = new CacheControlClient({
      configuration: configuration,
      credentialProvider: credentialProvider,
    });

    const numClients = configuration
      .getTransportStrategy()
      .getGrpcConfig()
      .getNumClients();
    const dataClients = range(numClients).map(
      (_, id) => new CacheDataClient(allProps, String(id), semaphore)
    );
    super(controlClient, dataClients);
    this._configuration = configuration;
    this.notYetAbstractedControlClient = controlClient;
    this.dataRequestConcurrencySemaphore = semaphore;

    this.logger = configuration.getLoggerFactory().getLogger(this);
    this.logger.debug('Creating Momento CacheClient');

    // Initialize middlewares that have init methods. These currently start
    // background tasks for logging that will execute until they are explicitly
    // stopped. This is usually handled by the client's close method, but if
    // there is ever a chance that this client constructor may fail after these
    // methods are called, it is up to you to catch the exception and call close
    // on each of these manually.
    this._configuration.getMiddlewares().forEach(m => {
      if (m.init) {
        m.init();
      }
    });
  }

  public close() {
    if (this.dataRequestConcurrencySemaphore !== undefined) {
      this.dataRequestConcurrencySemaphore.purge();
    }
    this.controlClient.close();
    this.dataClients.map(dc => dc.close());
    this._configuration.getMiddlewares().forEach(m => {
      if (m.close) {
        m.close();
      }
    });
  }

  /**
   * Creates a new instance of CacheClient. If eagerConnectTimeout is present in the given props, the client will
   * eagerly create its connection to Momento. It will wait until the connection is established, or until the timout
   * runs out. It the timeout runs out, the client will be valid to use, but it may still be connecting in the background.
   * @param {EagerCacheClientProps} props configuration and credentials for creating a CacheClient.
   */
  static async create(props: EagerCacheClientProps): Promise<CacheClient> {
    const client = new CacheClient(props);
    try {
      const timeout =
        props.eagerConnectTimeout !== undefined
          ? props.eagerConnectTimeout
          : EAGER_CONNECTION_DEFAULT_TIMEOUT_SECONDS;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      validateTimeout(timeout);
      // client need to explicitly set the value as 0 to disable eager connection.
      if (props.eagerConnectTimeout !== 0) {
        await Promise.all(
          client.dataClients.map(dc => (dc as CacheDataClient).connect(timeout))
        );
      }
      return client;
    } catch (e) {
      client.close();
      throw e;
    }
  }

  /**
   * Returns the configuration used to create the CacheClient.
   *
   * @readonly
   * @type {Configuration} - The configuration used to create the CacheClient.
   * @memberof CacheClient
   */
  public get configuration(): Configuration {
    return this._configuration;
  }

  /**
   * Flushes / clears all the items of the given cache
   *
   * @param {string} cacheName - The cache to be flushed.
   * @returns {Promise<CacheFlush.Response>} -
   * {@link CacheFlush.Success} on success.
   * {@link CacheFlush.Error} on failure.
   */
  public override async flushCache(
    cacheName: string,
    options?: ControlCallOptions
  ): Promise<CacheFlush.Response> {
    return await this.notYetAbstractedControlClient.flushCache(
      cacheName,
      options
    );
  }
}

function getDefaultCacheClientConfiguration(): Configuration {
  const config = Configurations.Laptop.latest();
  const logger = config.getLoggerFactory().getLogger('CacheClient');
  logger.info(
    'No configuration provided to CacheClient. Using default "Laptop" configuration, suitable for development. For production use, consider specifying an explicit configuration.'
  );
  return config;
}

/**
 * @deprecated use {CacheClient} instead
 */
export class SimpleCacheClient extends CacheClient {}
