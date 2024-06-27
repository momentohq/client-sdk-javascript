import {
  CredentialProvider,
  InvalidArgumentError,
  MomentoErrorCode,
  MomentoLogger,
  MomentoLoggerFactory,
  StorageDelete,
  StorageGet,
  StoragePut,
  UnknownError,
} from '@gomomento/sdk-core';
import {validateStoreName} from '@gomomento/sdk-core/dist/src/internal/utils';
import {store} from '@gomomento/generated-types/dist/store';
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {
  ChannelCredentials,
  Interceptor,
  Metadata,
  ServiceError,
} from '@grpc/grpc-js';
import {version} from '../../package.json';
import {grpcChannelOptionsFromGrpcConfig} from './grpc/grpc-channel-options';
import {IStorageDataClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {StorageConfiguration} from '../config/storage-configuration';
import {StorageClientPropsWithConfig} from './storage-client-props-with-config';
import {StaticGrpcConfiguration} from '../config/transport/cache';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';

export class StorageDataClient implements IStorageDataClient {
  private readonly configuration: StorageConfiguration;
  private readonly credentialProvider: CredentialProvider;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly logger: MomentoLogger;
  private readonly requestTimeoutMs: number;
  private readonly client: store.StoreClient;
  private readonly interceptors: Interceptor[];
  private static readonly DEFAULT_MAX_SESSION_MEMORY_MB: number = 256;

  /**
   * @param {StorageClientPropsWithConfig} props
   */
  constructor(props: StorageClientPropsWithConfig) {
    this.configuration = props.configuration;
    this.credentialProvider = props.credentialProvider;
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(false);
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

    this.client = new store.StoreClient(
      this.credentialProvider.getStorageEndpoint(),
      this.credentialProvider.isStorageEndpointSecure()
        ? ChannelCredentials.createSsl()
        : ChannelCredentials.createInsecure(),
      channelOptions
    );
    this.interceptors = this.initializeInterceptors(
      this.configuration.getLoggerFactory()
    );
  }

  close() {
    this.logger.debug('Closing storage data clients');
    this.client.close();
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout ms: ${String(timeout)}`);
    if (timeout !== undefined && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  private validateStoreNameOrThrowError(storeName: string) {
    try {
      validateStoreName(storeName);
      return;
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoragePut.Error(err)
      );
    }
  }

  private initializeInterceptors(
    _loggerFactory: MomentoLoggerFactory
  ): Interceptor[] {
    const headers = [
      new Header('Authorization', this.credentialProvider.getAuthToken()),
      new Header('agent', `nodejs:store:${version}`),
      new Header('runtime-version', `nodejs:${process.versions.node}`),
    ];
    return [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(this.requestTimeoutMs),
    ];
  }

  private createMetadata(storeName: string): Metadata {
    const metadata = new Metadata();
    metadata.set('store', storeName);
    return metadata;
  }

  public async get(
    storeName: string,
    key: string
  ): Promise<StorageGet.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StorageGet.Error(err)
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
  ): Promise<StorageGet.Response> {
    const request = new store._StoreGetRequest({
      key: key,
    });
    const metadata = this.createMetadata(storeName);
    return await new Promise((resolve, reject) => {
      this.client.Get(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp) => {
          const value = resp?.value?.value;
          if (value) {
            switch (value) {
              case 'double_value': {
                return resolve(
                  StorageGet.Success.ofDouble(resp.value.double_value)
                );
              }
              case 'string_value': {
                return resolve(
                  StorageGet.Success.ofString(resp.value.string_value)
                );
              }
              case 'bytes_value': {
                return resolve(
                  StorageGet.Success.ofBytes(resp.value.bytes_value)
                );
              }
              case 'integer_value': {
                return resolve(
                  StorageGet.Success.ofInt(resp.value.integer_value)
                );
              }
              case 'none': {
                return resolve(
                  new StorageGet.Error(
                    new UnknownError(
                      'StorageGet responded with an unknown result'
                    )
                  )
                );
              }
            }
          } else {
            const sdkError = this.cacheServiceErrorMapper.convertError(err);
            if (
              sdkError.errorCode() ===
              MomentoErrorCode.STORE_ITEM_NOT_FOUND_ERROR
            ) {
              return resolve(new StorageGet.Success(undefined));
            }
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StorageGet.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }

  public async putInt(
    storeName: string,
    key: string,
    value: number
  ): Promise<StoragePut.Response> {
    this.validateStoreNameOrThrowError(storeName);
    this.logger.trace(
      `Issuing 'put' request; store: ${storeName}, key: ${key}`
    );
    const storeValue = new store._StoreValue({integer_value: value});
    return await this.sendPut(storeName, key, storeValue);
  }

  public async putDouble(
    storeName: string,
    key: string,
    value: number
  ): Promise<StoragePut.Response> {
    this.validateStoreNameOrThrowError(storeName);
    this.logger.trace(
      `Issuing 'put' request; store: ${storeName}, key: ${key}`
    );
    const storeValue = new store._StoreValue({double_value: value});
    return await this.sendPut(storeName, key, storeValue);
  }

  public async putString(
    storeName: string,
    key: string,
    value: string
  ): Promise<StoragePut.Response> {
    this.validateStoreNameOrThrowError(storeName);
    this.logger.trace(
      `Issuing 'put' request; store: ${storeName}, key: ${key}`
    );
    const storeValue = new store._StoreValue({string_value: value});
    return await this.sendPut(storeName, key, storeValue);
  }

  public async putBytes(
    storeName: string,
    key: string,
    value: Uint8Array
  ): Promise<StoragePut.Response> {
    this.validateStoreNameOrThrowError(storeName);
    this.logger.trace(
      `Issuing 'put' request; store: ${storeName}, key: ${key}`
    );
    const storeValue = new store._StoreValue({bytes_value: value});
    return await this.sendPut(storeName, key, storeValue);
  }

  private async sendPut(
    storeName: string,
    key: string,
    storeValue: store._StoreValue
  ): Promise<StoragePut.Response> {
    const request = new store._StorePutRequest({
      key: key,
      value: storeValue,
    });
    const metadata = this.createMetadata(storeName);
    return await new Promise((resolve, reject) => {
      this.client.Put(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp) => {
          if (resp) {
            resolve(new StoragePut.Success());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StoragePut.Error(e),
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
  ): Promise<StorageDelete.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StorageDelete.Error(err)
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
  ): Promise<StorageDelete.Response> {
    const request = new store._StoreDeleteRequest({
      key: key,
    });
    const metadata = this.createMetadata(storeName);
    return await new Promise((resolve, reject) => {
      this.client.Delete(
        request,
        metadata,
        {
          interceptors: this.interceptors,
        },
        (err: ServiceError | null, resp) => {
          if (resp) {
            resolve(new StorageDelete.Success());
          } else {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StorageDelete.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          }
        }
      );
    });
  }
}
