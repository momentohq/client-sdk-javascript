import {control} from '@gomomento/generated-types-webtext';
import {
  CreateCache,
  DeleteCache,
  ListCaches,
  CredentialProvider,
  MomentoLogger,
  CacheFlush,
  CacheInfo,
  MomentoErrorCode,
} from '..';
import {Configuration} from '../config/configuration';
import {Request, UnaryResponse} from 'grpc-web';
import {
  _CreateCacheRequest,
  _DeleteCacheRequest,
  _ListCachesRequest,
  _FlushCacheRequest,
} from '@gomomento/generated-types-webtext/dist/controlclient_pb';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {IControlClient} from '@gomomento/sdk-core/dist/src/internal/clients';
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

export class CacheControlClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IControlClient
{
  private readonly clientWrapper: control.ScsControlClient;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;

  private readonly clientMetadataProvider: ClientMetadataProvider;

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    this.logger.debug(
      `Creating control client using endpoint: '${getWebControlEndpoint(
        props.credentialProvider
      )}`
    );

    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
      clientType: 'cache',
    });
    this.clientWrapper = new control.ScsControlClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebControlEndpoint(props.credentialProvider),
      null,
      {}
    );
  }

  close() {
    this.logger.debug('Closing cache control client');
    // do nothing as gRPC web version doesn't expose a close() yet.
    // this is needed as we have added close to `IControlClient` extended
    // by both nodejs and web SDKs
  }

  public async createCache(name: string): Promise<CreateCache.Response> {
    try {
      validateCacheName(name);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CreateCache.Error(err)
      );
    }
    this.logger.debug(`Creating cache: ${name}`);
    const request = new _CreateCacheRequest();
    request.setCacheName(name);

    return await new Promise<CreateCache.Response>((resolve, reject) => {
      this.clientWrapper.createCache(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, _resp) => {
          if (err) {
            const sdkError = this.cacheServiceErrorMapper.convertError(err);
            if (
              sdkError.errorCode() ===
              MomentoErrorCode.CACHE_ALREADY_EXISTS_ERROR
            ) {
              resolve(new CreateCache.AlreadyExists());
            } else {
              this.cacheServiceErrorMapper.resolveOrRejectError({
                err: err,
                errorResponseFactoryFn: e => new CreateCache.Error(e),
                resolveFn: resolve,
                rejectFn: reject,
              });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new DeleteCache.Error(err)
      );
    }
    const request = new _DeleteCacheRequest();
    request.setCacheName(name);
    this.logger.debug(`Deleting cache: ${name}`);
    return await new Promise<DeleteCache.Response>((resolve, reject) => {
      this.clientWrapper.deleteCache(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, _resp) => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new DeleteCache.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CacheFlush.Error(err)
      );
    }
    this.logger.trace(`Flushing cache: ${cacheName}`);
    return await this.sendFlushCache(cacheName);
  }

  private async sendFlushCache(
    cacheName: string
  ): Promise<CacheFlush.Response> {
    const request = new _FlushCacheRequest();
    request.setCacheName(cacheName);
    return await new Promise<CacheFlush.Response>((resolve, reject) => {
      this.clientWrapper.flushCache(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (resp) {
            resolve(new CacheFlush.Success());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new CacheFlush.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async listCaches(): Promise<ListCaches.Response> {
    const request = new _ListCachesRequest();
    request.setNextToken('');
    this.logger.debug("Issuing 'listCaches' request");
    return await new Promise<ListCaches.Response>((resolve, reject) => {
      this.clientWrapper.listCaches(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new ListCaches.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
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
