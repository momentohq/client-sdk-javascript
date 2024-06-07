import {
  CredentialProvider,
  InvalidArgumentError,
  MomentoLogger,
  MomentoLoggerFactory,
  StoreGet,
  StoreSet,
  StoreDelete,
} from '@gomomento/sdk-core';
import {validateStoreName} from '@gomomento/sdk-core/dist/src/internal/utils';
import {store} from '@gomomento/generated-types/dist/store';
import {IdleGrpcClientWrapper} from './grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from './grpc/grpc-client-wrapper';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  ChannelCredentials,
  Interceptor,
  Metadata,
  ServiceError,
} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {middlewaresInterceptor} from './grpc/middlewares-interceptor';
import {
  Middleware,
  MiddlewareRequestHandlerContext,
} from '../config/middleware/middleware';
import {grpcChannelOptionsFromGrpcConfig} from './grpc/grpc-channel-options';
import {IStorageDataClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {StorageConfiguration} from '../config/storage-configuration';
import {StorageClientPropsWithConfig} from './storage-client-props-with-config';
import {StaticGrpcConfiguration} from '../config/transport/cache';

export const CONNECTION_ID_KEY = Symbol('connectionID');

export class StorageDataClient implements IStorageDataClient {
  private readonly configuration: StorageConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly requestTimeoutMs: number;
  private readonly clientWrapper: GrpcClientWrapper<store.StoreClient>;
  private readonly interceptors: Interceptor[];
  private static readonly DEFAULT_MAX_SESSION_MEMORY_MB: number = 256;

  /**
   * @param {StorageClientPropsWithConfig} props
   * @param dataClientID
   */
  constructor(props: StorageClientPropsWithConfig, dataClientID: string) {
    this.configuration = props.configuration;
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(false);
    this.credentialProvider = props.credentialProvider;
    this.logger = this.configuration.getLoggerFactory().getLogger(this);
    this.requestTimeoutMs = this.configuration
      .getTransportStrategy()
      .getGrpcConfig()
      .getDeadlineMillis();
    this.validateRequestTimeout(this.requestTimeoutMs);
    this.logger.debug(
      `Creating leaderboard client using endpoint: '${this.credentialProvider.getStorageEndpoint()}'`
    );

    // NOTE: This is hard-coded for now but we may want to expose it via StorageConfiguration in the
    // future, as we do with some of the other clients.
    const grpcConfig = new StaticGrpcConfiguration({
      deadlineMillis: this.configuration
        .getTransportStrategy()
        .getGrpcConfig()
        .getDeadlineMillis(),
      maxSessionMemoryMb: StorageDataClient.DEFAULT_MAX_SESSION_MEMORY_MB,
    });
    const channelOptions = grpcChannelOptionsFromGrpcConfig(grpcConfig);

    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new store.StoreClient(
          this.credentialProvider.getStorageEndpoint(),
          this.credentialProvider.isStorageEndpointSecure()
            ? ChannelCredentials.createSsl()
            : ChannelCredentials.createInsecure(),
          channelOptions
        ),
      loggerFactory: this.configuration.getLoggerFactory(),
      maxIdleMillis: this.configuration
        .getTransportStrategy()
        .getMaxIdleMillis(),
    });

    const context: MiddlewareRequestHandlerContext = {};
    context[CONNECTION_ID_KEY] = dataClientID;
    this.interceptors = this.initializeInterceptors(
      this.configuration.getLoggerFactory(),
      this.configuration.getMiddlewares(),
      context
    );
  }

  close() {
    this.logger.debug('Closing storage data clients');
    this.clientWrapper.getClient().close();
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  private initializeInterceptors(
    _loggerFactory: MomentoLoggerFactory,
    middlewares: Middleware[],
    middlewareRequestContext: MiddlewareRequestHandlerContext
  ): Interceptor[] {
    const headers = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:${version}`),
    ];
    return [
      middlewaresInterceptor(
        _loggerFactory,
        middlewares,
        middlewareRequestContext
      ),
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(this.requestTimeoutMs),
    ];
  }

  private createMetadata(storeName: string): Metadata {
    const metadata = new Metadata();
    metadata.set('storage', storeName);
    return metadata;
  }

  public async get(storeName: string, key: string): Promise<StoreGet.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoreGet.Error(err)
      );
    }
    this.logger.trace(
      `Issuing 'get' request; store: ${storeName}, key: ${key}`
    );
    return await this.sendGet(storeName, key);
  }

  private async sendGet(
    storeName: string,
    key: string
  ): Promise<StoreGet.Response> {
    const request = new store._StoreGetRequest({
      key: key,
    });
    const metadata = this.createMetadata(storeName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().Get(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp) => {
          if (resp && resp.value.value !== 'none') {
            switch (resp.value.value) {
              case 'double_value': {
                return resolve(
                  new StoreGet.DoubleResponse(resp.value.double_value)
                );
              }
              case 'string_value': {
                return resolve(
                  new StoreGet.StringResponse(resp.value.string_value)
                );
              }
              case 'bytes_value': {
                return resolve(
                  new StoreGet.BytesResponse(resp.value.bytes_value)
                );
              }
              case 'integer_value': {
                return resolve(
                  new StoreGet.IntegerResponse(resp.value.integer_value)
                );
              }
            }
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StoreGet.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async set(
    storeName: string,
    key: string,
    value: string | Uint8Array | number
  ): Promise<StoreSet.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoreSet.Error(err)
      );
    }
    this.logger.trace(
      `Issuing 'get' request; store: ${storeName}, key: ${key}`
    );
    return await this.sendSet(storeName, key, value);
  }

  private async sendSet(
    storeName: string,
    key: string,
    value: string | Uint8Array | number
  ): Promise<StoreSet.Response> {
    const storeValue = new store._StoreValue();
    if (typeof value === 'string') {
      storeValue.string_value = value;
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        storeValue.integer_value = value;
      } else {
        storeValue.double_value = value;
      }
    } else {
      storeValue.bytes_value = value;
    }
    const request = new store._StoreSetRequest({
      key: key,
      value: storeValue,
    });
    const metadata = this.createMetadata(storeName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().Set(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp) => {
          if (resp) {
            resolve(new StoreSet.Success());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StoreSet.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async delete(
    storeName: string,
    key: string
  ): Promise<StoreDelete.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoreDelete.Error(err)
      );
    }
    this.logger.trace(
      `Issuing 'delete' request; store: ${storeName}, key: ${key}`
    );
    return await this.sendDelete(storeName, key);
  }

  private async sendDelete(
    storeName: string,
    key: string
  ): Promise<StoreDelete.Response> {
    const request = new store._StoreDeleteRequest({
      key: key,
    });
    const metadata = this.createMetadata(storeName);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.getClient().Delete(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp) => {
          if (resp) {
            resolve(new StoreDelete.Success());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StoreDelete.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }
}
