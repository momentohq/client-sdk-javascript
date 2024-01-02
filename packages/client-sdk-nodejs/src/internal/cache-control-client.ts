import {control} from '@gomomento/generated-types';
import grpcControl = control.control_client;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {
  CreateCache,
  DeleteCache,
  ListCaches,
  CreateSigningKey,
  ListSigningKeys,
  RevokeSigningKey,
  CacheFlush,
  CredentialProvider,
  MomentoLogger,
  CacheInfo,
} from '..';
import {version} from '../../package.json';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Configuration} from '../config/configuration';
import {
  validateCacheName,
  validateTtlMinutes,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {_SigningKey} from '@gomomento/sdk-core/dist/src/messages/responses/grpc-response-types';
import {
  CacheLimits,
  TopicLimits,
} from '@gomomento/sdk-core/dist/src/messages/cache-info';

export interface ControlClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}

export class CacheControlClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcControl.ScsControlClient>;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
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
      new Header('Agent', `nodejs:${version}`),
    ];
    this.interceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(CacheControlClient.REQUEST_TIMEOUT_MS),
    ];
    this.logger.debug(
      `Creating control client using endpoint: '${props.credentialProvider.getControlEndpoint()}`
    );
    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcControl.ScsControlClient(
          props.credentialProvider.getControlEndpoint(),
          ChannelCredentials.createSsl()
        ),
      loggerFactory: props.configuration.getLoggerFactory(),
      maxIdleMillis: props.configuration
        .getTransportStrategy()
        .getMaxIdleMillis(),
    });
  }

  public async createCache(name: string): Promise<CreateCache.Response> {
    try {
      validateCacheName(name);
    } catch (err) {
      return new CreateCache.Error(normalizeSdkError(err as Error));
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
              if (err.code === Status.ALREADY_EXISTS) {
                resolve(new CreateCache.AlreadyExists());
              } else {
                this.cacheServiceErrorMapper.handleError(
                  err,
                  e => new CreateCache.Error(e),
                  resolve,
                  reject
                );
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
              this.cacheServiceErrorMapper.handleError(
                err,
                e => new DeleteCache.Error(e),
                resolve,
                reject
              );
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
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new CacheFlush.Error(e),
              resolve,
              reject
            );
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
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new ListCaches.Error(e),
              resolve,
              reject
            );
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

  public async createSigningKey(
    ttlMinutes: number,
    endpoint: string
  ): Promise<CreateSigningKey.Response> {
    try {
      validateTtlMinutes(ttlMinutes);
    } catch (err) {
      return new CreateSigningKey.Error(normalizeSdkError(err as Error));
    }
    this.logger.debug("Issuing 'createSigningKey' request");
    const request = new grpcControl._CreateSigningKeyRequest();
    request.ttl_minutes = ttlMinutes;
    return await new Promise<CreateSigningKey.Response>((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .CreateSigningKey(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err) {
              this.cacheServiceErrorMapper.handleError(
                err,
                e => new CreateSigningKey.Error(e),
                resolve,
                reject
              );
            } else {
              const signingKey = new _SigningKey(resp?.key, resp?.expires_at);
              resolve(new CreateSigningKey.Success(endpoint, signingKey));
            }
          }
        );
    });
  }

  public async revokeSigningKey(
    keyId: string
  ): Promise<RevokeSigningKey.Response> {
    const request = new grpcControl._RevokeSigningKeyRequest();
    request.key_id = keyId;
    this.logger.debug("Issuing 'revokeSigningKey' request");
    return await new Promise<RevokeSigningKey.Response>((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .RevokeSigningKey(request, {interceptors: this.interceptors}, err => {
          if (err) {
            this.cacheServiceErrorMapper.handleError(
              err,
              e => new RevokeSigningKey.Error(e),
              resolve,
              reject
            );
          } else {
            resolve(new RevokeSigningKey.Success());
          }
        });
    });
  }

  public async listSigningKeys(
    endpoint: string
  ): Promise<ListSigningKeys.Response> {
    const request = new grpcControl._ListSigningKeysRequest();
    request.next_token = '';
    this.logger.debug("Issuing 'listSigningKeys' request");
    return await new Promise<ListSigningKeys.Response>((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .ListSigningKeys(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err || !resp) {
              this.cacheServiceErrorMapper.handleError(
                err,
                e => new ListSigningKeys.Error(e),
                resolve,
                reject
              );
            } else {
              const signingKeys = resp.signing_key.map(
                sk => new _SigningKey(sk.key_id, sk.expires_at)
              );
              resolve(
                new ListSigningKeys.Success(
                  endpoint,
                  signingKeys,
                  resp.next_token
                )
              );
            }
          }
        );
    });
  }
}
