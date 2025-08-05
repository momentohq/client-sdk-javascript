import {control} from '@gomomento/generated-types';
import grpcControl = control.control_client;
import {Header, HeaderInterceptor} from './grpc/headers-interceptor';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {
  CreateCache,
  DeleteCache,
  ListCaches,
  CacheFlush,
  CredentialProvider,
  MomentoLogger,
  CacheInfo,
  MomentoErrorCode,
} from '..';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Configuration} from '../config/configuration';
import {validateCacheName} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  CacheLimits,
  TopicLimits,
} from '@gomomento/sdk-core/dist/src/messages/cache-info';
import {RetryInterceptor} from './grpc/retry-interceptor';
import {secondsToMilliseconds} from '@gomomento/sdk-core/dist/src/utils';
import {grpcChannelOptionsFromGrpcConfig} from './grpc/grpc-channel-options';

export interface ControlClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}

export class CacheControlClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcControl.ScsControlClient>;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number =
    secondsToMilliseconds(60);
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    const headers = [
      new Header('Authorization', props.credentialProvider.getAuthToken()),
      new Header('agent', `nodejs:cache:${version}`),
      new Header('runtime-version', `nodejs:${process.versions.node}`),
    ];
    this.interceptors = [
      HeaderInterceptor.createHeadersInterceptor(headers),
      RetryInterceptor.createRetryInterceptor({
        clientName: 'CacheControlClient',
        loggerFactory: props.configuration.getLoggerFactory(),
        overallRequestTimeoutMs: CacheControlClient.REQUEST_TIMEOUT_MS,
      }),
    ];

    const grpcConfig = props.configuration
      .getTransportStrategy()
      .getGrpcConfig();
    const channelOptions = grpcChannelOptionsFromGrpcConfig(grpcConfig);

    this.logger.debug(
      `Creating control client using endpoint: '${props.credentialProvider.getControlEndpoint()}`
    );
    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcControl.ScsControlClient(
          props.credentialProvider.getControlEndpoint(),
          props.credentialProvider.isEndpointSecure()
            ? ChannelCredentials.createSsl()
            : ChannelCredentials.createInsecure(),
          channelOptions
        ),
      loggerFactory: props.configuration.getLoggerFactory(),
      clientTimeoutMillis: CacheControlClient.REQUEST_TIMEOUT_MS,
      maxIdleMillis: props.configuration
        .getTransportStrategy()
        .getMaxIdleMillis(),
    });
  }
  close() {
    this.logger.debug('Closing cache control client');
    this.clientWrapper.getClient().close();
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
    const request = new grpcControl._CreateCacheRequest({
      cache_name: name,
    });
    return await new Promise<CreateCache.Response>((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .CreateCache(
          request,
          {interceptors: this.interceptors},
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
    const request = new grpcControl._DeleteCacheRequest({
      cache_name: name,
    });
    this.logger.debug(`Deleting cache: ${name}`);
    return await new Promise<DeleteCache.Response>((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .DeleteCache(
          request,
          {interceptors: this.interceptors},
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
    this.logger.debug(`Flushing cache: ${cacheName}`);
    return await this.sendFlushCache(cacheName);
  }

  private async sendFlushCache(
    cacheName: string
  ): Promise<CacheFlush.Response> {
    const request = new grpcControl._FlushCacheRequest({
      cache_name: cacheName,
    });
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().FlushCache(
        request,
        {
          interceptors: this.interceptors,
        },
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
    const request = new grpcControl._ListCachesRequest();
    request.next_token = '';
    this.logger.debug("Issuing 'listCaches' request");
    return await new Promise<ListCaches.Response>((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .ListCaches(request, {interceptors: this.interceptors}, (err, resp) => {
          if (err || !resp) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new ListCaches.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            const caches = resp.cache.map(cache => {
              const cacheName = cache.cache_name;
              const topicLimits: TopicLimits = {
                maxPublishMessageSizeKb:
                  cache.topic_limits?.max_publish_message_size_kb || 0,
                maxSubscriptionCount:
                  cache.topic_limits?.max_subscription_count || 0,
                maxPublishRate: cache.topic_limits?.max_publish_rate || 0,
              };
              const cacheLimits: CacheLimits = {
                maxTtlSeconds: cache.cache_limits?.max_ttl_seconds || 0,
                maxItemSizeKb: cache.cache_limits?.max_item_size_kb || 0,
                maxThroughputKbps: cache.cache_limits?.max_throughput_kbps || 0,
                maxTrafficRate: cache.cache_limits?.max_traffic_rate || 0,
              };
              return new CacheInfo(cacheName, topicLimits, cacheLimits);
            });
            resolve(new ListCaches.Success(caches));
          }
        });
    });
  }
}
