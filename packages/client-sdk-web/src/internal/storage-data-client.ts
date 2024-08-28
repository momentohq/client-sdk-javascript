import {store} from '@gomomento/generated-types-webtext';
import {
  StorageGet,
  StoragePut,
  StorageDelete,
  MomentoLogger,
  UnknownError,
  MomentoErrorCode,
} from '..';
import {Request, UnaryResponse} from 'grpc-web';
import {
  _StoreDeleteRequest,
  _StoreGetRequest,
  _StorePutRequest,
  _StoreValue,
} from '@gomomento/generated-types-webtext/dist/store_pb';
import {IStorageDataClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {validateStoreName} from '@gomomento/sdk-core/dist/src/internal/utils';
import {
  convertToB64String,
  createStorageMetadata,
  getWebStorageEndpoint,
} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import ValueCase = _StoreValue.ValueCase;
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {StorageClientAllProps} from './storage-client-all-props';

export class StorageDataClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IStorageDataClient
{
  private readonly clientWrapper: store.StoreClient;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly logger: MomentoLogger;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  // TODO make this part of configuration
  private readonly deadlineMillis: number = 10000;

  /**
   * @param {DataClientProps} props
   */
  constructor(props: StorageClientAllProps) {
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(false);
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.logger.debug(
      `Creating storage data client using endpoint: '${getWebStorageEndpoint(
        props.credentialProvider
      )}`
    );

    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
      clientType: 'store',
    });
    this.clientWrapper = new store.StoreClient(
      // Note: all web SDK requests are routed to a `web.` subdomain to allow us flexibility on the server
      getWebStorageEndpoint(props.credentialProvider),
      null
    );
  }

  close() {
    this.logger.debug('Closing cache control client');
    // do nothing as gRPC web version doesn't expose a close() yet.
    // this is needed as we have added close to `IControlClient` extended
    // by both nodejs and web SDKs
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
    this.logger.trace(`Issuing 'get' request; key: ${key.toString()}`);
    const result = await this.sendGet(storeName, convertToB64String(key));
    this.logger.trace(`'get' request result: ${result.toString()}`);
    return result;
  }

  private async sendGet(
    storeName: string,
    key: string
  ): Promise<StorageGet.Response> {
    const request = new _StoreGetRequest();
    request.setKey(key);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.get(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createStorageMetadata(storeName, this.deadlineMillis),
        },
        (err, resp) => {
          const value = resp?.getValue() as _StoreValue;
          if (resp) {
            switch (value?.getValueCase()) {
              case undefined:
              case ValueCase.VALUE_NOT_SET: {
                return resolve(
                  new StorageGet.Error(
                    new UnknownError(
                      'StorageGet responded with an unknown result'
                    )
                  )
                );
              }
              case ValueCase.BYTES_VALUE: {
                return resolve(
                  StorageGet.Found.ofBytes(value.getBytesValue_asU8())
                );
              }
              case ValueCase.STRING_VALUE: {
                return resolve(
                  StorageGet.Found.ofString(value.getStringValue())
                );
              }
              case ValueCase.INTEGER_VALUE: {
                return resolve(StorageGet.Found.ofInt(value.getIntegerValue()));
              }
              case ValueCase.DOUBLE_VALUE: {
                return resolve(
                  StorageGet.Found.ofDouble(value.getDoubleValue())
                );
              }
            }
          } else {
            const sdkError = this.cacheServiceErrorMapper.convertError(err);
            if (
              sdkError.errorCode() ===
              MomentoErrorCode.STORE_ITEM_NOT_FOUND_ERROR
            ) {
              return resolve(new StorageGet.NotFound());
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
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoragePut.Error(err)
      );
    }
    this.logger.trace(`Issuing 'put' request; key: ${key.toString()}`);
    const storeValue = new _StoreValue();
    storeValue.setIntegerValue(value);
    const result = await this.sendPut(
      storeName,
      convertToB64String(key),
      storeValue
    );
    this.logger.trace(`'put' request result: ${result.toString()}`);
    return result;
  }

  public async putDouble(
    storeName: string,
    key: string,
    value: number
  ): Promise<StoragePut.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoragePut.Error(err)
      );
    }
    this.logger.trace(`Issuing 'put' request; key: ${key.toString()}`);
    const storeValue = new _StoreValue();
    storeValue.setDoubleValue(value);
    const result = await this.sendPut(
      storeName,
      convertToB64String(key),
      storeValue
    );
    this.logger.trace(`'put' request result: ${result.toString()}`);
    return result;
  }

  public async putBytes(
    storeName: string,
    key: string,
    value: Uint8Array
  ): Promise<StoragePut.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoragePut.Error(err)
      );
    }
    this.logger.trace(`Issuing 'put' request; key: ${key.toString()}`);
    const storeValue = new _StoreValue();
    storeValue.setBytesValue(value);
    const result = await this.sendPut(
      storeName,
      convertToB64String(key),
      storeValue
    );
    this.logger.trace(`'put' request result: ${result.toString()}`);
    return result;
  }

  public async putString(
    storeName: string,
    key: string,
    value: string
  ): Promise<StoragePut.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoragePut.Error(err)
      );
    }
    this.logger.trace(`Issuing 'put' request; key: ${key.toString()}`);
    const storeValue = new _StoreValue();
    storeValue.setStringValue(value);
    const result = await this.sendPut(
      storeName,
      convertToB64String(key),
      storeValue
    );
    this.logger.trace(`'put' request result: ${result.toString()}`);
    return result;
  }

  private async sendPut(
    storeName: string,
    key: string,
    storeValue: _StoreValue
  ): Promise<StoragePut.Response> {
    const request = new _StorePutRequest();
    request.setKey(key);
    request.setValue(storeValue);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.put(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createStorageMetadata(storeName, this.deadlineMillis),
        },
        (err, _resp) => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StoragePut.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new StoragePut.Success());
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
    this.logger.trace(`Issuing 'delete' request; key: ${key.toString()}`);
    const result = await this.sendDelete(storeName, convertToB64String(key));
    this.logger.trace(`'delete' request result: ${result.toString()}`);
    return result;
  }

  private async sendDelete(
    storeName: string,
    key: string
  ): Promise<StorageDelete.Response> {
    const request = new _StoreDeleteRequest();
    request.setKey(key);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.delete(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createStorageMetadata(storeName, this.deadlineMillis),
        },
        (err, _resp) => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StorageDelete.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new StorageDelete.Success());
          }
        }
      );
    });
  }
}
