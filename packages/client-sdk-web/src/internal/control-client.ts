import {control} from '@gomomento/generated-types-webtext';
import {
  CreateCache,
  DeleteCache,
  ListCaches,
  CredentialProvider,
  MomentoLogger,
  CacheFlush,
  CacheInfo,
} from '..';
import {Configuration} from '../config/configuration';
import {Request, StatusCode, UnaryResponse} from 'grpc-web';
import {
  _CreateCacheRequest,
  _DeleteCacheRequest,
  _ListCachesRequest,
  _FlushCacheRequest,
} from '@gomomento/generated-types-webtext/dist/controlclient_pb';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {IControlClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {validateCacheName} from '@gomomento/sdk-core/dist/src/internal/utils';
import {getWebControlEndpoint} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import {
  CacheLimits,
  TopicLimits,
} from '@gomomento/sdk-core/dist/src/messages/cache-info';

export interface ControlClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}

export class ControlClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IControlClient
{
  private readonly clientWrapper: control.ScsControlClient;
  private readonly logger: MomentoLogger;

  private readonly clientMetadataProvider: ClientMetadataProvider;

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.debug(
      `Creating control client using endpoint: '${getWebControlEndpoint(
        props.credentialProvider
      )}`
    );

    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
    });
    this.clientWrapper = new control.ScsControlClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebControlEndpoint(props.credentialProvider),
      null,
      {}
    );
  }

  public async createCache(name: string): Promise<CreateCache.Response> {
    try {
      validateCacheName(name);
    } catch (err) {
      return new CreateCache.Error(normalizeSdkError(err as Error));
    }
    this.logger.info(`Creating cache: ${name}`);
    const request = new _CreateCacheRequest();
    request.setCacheName(name);

    return await new Promise<CreateCache.Response>(resolve => {
      this.clientWrapper.createCache(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            if (err.code === StatusCode.ALREADY_EXISTS) {
              resolve(new CreateCache.AlreadyExists());
            } else {
              resolve(new CreateCache.Error(cacheServiceErrorMapper(err)));
            }
          } else {
            resolve(new CreateCache.Success());
          }
        }
      );
    });
  }

  public async deleteCache(name: string): Promise<DeleteCache.Response> {
    try {
      validateCacheName(name);
    } catch (err) {
      return new DeleteCache.Error(normalizeSdkError(err as Error));
    }
    const request = new _DeleteCacheRequest();
    request.setCacheName(name);
    this.logger.info(`Deleting cache: ${name}`);
    return await new Promise<DeleteCache.Response>(resolve => {
      this.clientWrapper.deleteCache(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            resolve(new DeleteCache.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(new DeleteCache.Success());
          }
        }
      );
    });
  }

  public async flushCache(cacheName: string): Promise<CacheFlush.Response> {
    try {
      validateCacheName(cacheName);
    } catch (err) {
      return new CacheFlush.Error(normalizeSdkError(err as Error));
    }
    this.logger.trace(`Flushing cache: ${cacheName}`);
    return await this.sendFlushCache(cacheName);
  }

  private async sendFlushCache(
    cacheName: string
  ): Promise<CacheFlush.Response> {
    const request = new _FlushCacheRequest();
    request.setCacheName(cacheName);
    return await new Promise<CacheFlush.Response>(resolve => {
      this.clientWrapper.flushCache(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (resp) {
            resolve(new CacheFlush.Success());
          } else {
            resolve(new CacheFlush.Error(cacheServiceErrorMapper(err)));
          }
        }
      );
    });
  }

  public async listCaches(): Promise<ListCaches.Response> {
    const request = new _ListCachesRequest();
    request.setNextToken('');
    this.logger.debug("Issuing 'listCaches' request");
    return await new Promise<ListCaches.Response>(resolve => {
      this.clientWrapper.listCaches(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (err) {
            resolve(new ListCaches.Error(cacheServiceErrorMapper(err)));
          } else {
            const caches = resp.getCacheList().map(cache => {
              const cacheName = cache.getCacheName();
              const topicLimits: TopicLimits = {
                maxPublishMessageSizeKb:
                  cache.getTopicLimits()?.getMaxPublishMessageSizeKb() || 0,
                maxSubscriptionCount:
                  cache.getTopicLimits()?.getMaxSubscriptionCount() || 0,
                maxPublishRate:
                  cache.getTopicLimits()?.getMaxPublishRate() || 0,
              };
              const cacheLimits: CacheLimits = {
                maxTtlSeconds: cache.getCacheLimits()?.getMaxTtlSeconds() || 0,
                maxItemSizeKb: cache.getCacheLimits()?.getMaxItemSizeKb() || 0,
                maxThroughputKbps:
                  cache.getCacheLimits()?.getMaxThroughputKbps() || 0,
                maxTrafficRate:
                  cache.getCacheLimits()?.getMaxTrafficRate() || 0,
              };
              return new CacheInfo(cacheName, topicLimits, cacheLimits);
            });
            resolve(new ListCaches.Success(caches));
          }
        }
      );
    });
  }
}
