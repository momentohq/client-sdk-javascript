import {control} from '@gomomento/generated-types';
import grpcControl = control.control_client;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
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
  validateIndexName,
  validateNumDimensions,
  validateTtlMinutes,
} from '@gomomento/sdk-core/dist/src/internal/utils';
import {normalizeSdkError} from '@gomomento/sdk-core/dist/src/errors';
import {_SigningKey} from '@gomomento/sdk-core/dist/src/messages/responses/grpc-response-types';
import {
  CacheLimits,
  TopicLimits,
} from '@gomomento/sdk-core/dist/src/messages/cache-info';
import {
  CreateVectorIndex,
  DeleteVectorIndex,
  ListVectorIndexes,
} from '@gomomento/sdk-core';

export interface ControlClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}

export class ControlClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcControl.ScsControlClient>;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: MomentoLogger;

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    const headers = [
      new Header('Authorization', props.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
    this.interceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(ControlClient.REQUEST_TIMEOUT_MS),
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
    this.logger.info(`Creating cache: ${name}`);
    const request = new grpcControl._CreateCacheRequest({
      cache_name: name,
    });
    return await new Promise<CreateCache.Response>(resolve => {
      this.clientWrapper.getClient().CreateCache(
        request,
        {interceptors: this.interceptors},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            if (err.code === Status.ALREADY_EXISTS) {
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
    const request = new grpcControl._DeleteCacheRequest({
      cache_name: name,
    });
    this.logger.info(`Deleting cache: ${name}`);
    return await new Promise<DeleteCache.Response>(resolve => {
      this.clientWrapper.getClient().DeleteCache(
        request,
        {interceptors: this.interceptors},
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
    const request = new grpcControl._FlushCacheRequest({
      cache_name: cacheName,
    });
    return await new Promise(resolve => {
      this.clientWrapper.getClient().FlushCache(
        request,
        {
          interceptors: this.interceptors,
        },
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
    const request = new grpcControl._ListCachesRequest();
    request.next_token = '';
    this.logger.debug("Issuing 'listCaches' request");
    return await new Promise<ListCaches.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .ListCaches(request, {interceptors: this.interceptors}, (err, resp) => {
          if (err || !resp) {
            resolve(new ListCaches.Error(cacheServiceErrorMapper(err)));
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

  public async createIndex(
    indexName: string,
    numDimensions: number
  ): Promise<CreateVectorIndex.Response> {
    try {
      validateIndexName(indexName);
      validateNumDimensions(numDimensions);
    } catch (err) {
      return new CreateVectorIndex.Error(normalizeSdkError(err as Error));
    }
    this.logger.debug("Issuing 'createIndex' request");
    const request = new grpcControl._CreateIndexRequest();
    request.index_name = indexName;
    request.num_dimensions = numDimensions;
    return await new Promise<CreateVectorIndex.Response>(resolve => {
      this.clientWrapper.getClient().CreateIndex(
        request,
        {interceptors: this.interceptors},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            if (err.code === Status.ALREADY_EXISTS) {
              resolve(new CreateVectorIndex.AlreadyExists());
            } else {
              resolve(
                new CreateVectorIndex.Error(cacheServiceErrorMapper(err))
              );
            }
          } else {
            resolve(new CreateVectorIndex.Success());
          }
        }
      );
    });
  }

  public async listIndexes(): Promise<ListCaches.Response> {
    const request = new grpcControl._ListIndexesRequest();
    this.logger.debug("Issuing 'listIndexes' request");
    return await new Promise<ListVectorIndexes.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .ListIndexes(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err || !resp) {
              // TODO: `Argument of type 'unknown' is not assignable to parameter of type 'Error'.`
              //  I don't see how this is different from the other methods here. So, yeah, what?
              resolve(
                new ListVectorIndexes.Error(cacheServiceErrorMapper(err))
              );
            } else {
              // TODO: um, what?
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
              const indexes = resp.index_names;
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              resolve(new ListVectorIndexes.Success(indexes));
            }
          }
        );
    });
  }

  public async deleteIndex(name: string): Promise<DeleteVectorIndex.Response> {
    try {
      validateIndexName(name);
    } catch (err) {
      return new DeleteVectorIndex.Error(normalizeSdkError(err as Error));
    }
    const request = new grpcControl._DeleteIndexRequest({
      index_name: name,
    });
    this.logger.info(`Deleting index: ${name}`);
    return await new Promise<DeleteVectorIndex.Response>(resolve => {
      this.clientWrapper.getClient().DeleteIndex(
        request,
        {interceptors: this.interceptors},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            resolve(new DeleteVectorIndex.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(new DeleteVectorIndex.Success());
          }
        }
      );
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
    return await new Promise<CreateSigningKey.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .CreateSigningKey(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err) {
              resolve(new CreateSigningKey.Error(cacheServiceErrorMapper(err)));
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
    return await new Promise<RevokeSigningKey.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .RevokeSigningKey(request, {interceptors: this.interceptors}, err => {
          if (err) {
            resolve(new RevokeSigningKey.Error(cacheServiceErrorMapper(err)));
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
    return await new Promise<ListSigningKeys.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .ListSigningKeys(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err || !resp) {
              resolve(new ListSigningKeys.Error(cacheServiceErrorMapper(err)));
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
