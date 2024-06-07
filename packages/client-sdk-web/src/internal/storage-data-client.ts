import {store} from '@gomomento/generated-types-webtext';
import {
  StoreGet,
  StoreSet,
  StoreDelete,
  CredentialProvider,
  MomentoLogger,
  UnknownError,
} from '..';
import {Request, UnaryResponse} from 'grpc-web';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {
  _StoreDeleteRequest,
  _StoreGetRequest,
  _StoreSetRequest,
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
import {StorageConfiguration} from '../config/storage-configuration';

export interface StorageDataClientProps {
  configuration: StorageConfiguration;
  credentialProvider: CredentialProvider;
}

export class StorageDataClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IStorageDataClient
{
  private readonly clientWrapper: store.StoreClient;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;
  private readonly clientMetadataProvider: ClientMetadataProvider;
  // TODO make this part of configuration
  private readonly deadlineMillis: number = 10000;

  /**
   * @param {DataClientProps} props
   */
  constructor(props: StorageDataClientProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(
      props.configuration.getThrowOnErrors()
    );
    this.logger.debug(
      `Creating storage data client using endpoint: '${getWebStorageEndpoint(
        props.credentialProvider
      )}`
    );

    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
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

  public async get(storeName: string, key: string): Promise<StoreGet.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoreGet.Error(err)
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
  ): Promise<StoreGet.Response> {
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
          const value = resp?.getValue();
          if (resp && value) {
            switch (value.getValueCase()) {
              case ValueCase.VALUE_NOT_SET: {
                return resolve(
                  new StoreGet.Error(
                    new UnknownError(
                      'An unknown error occurred: ' + resp.toString()
                    )
                  )
                );
              }
              case ValueCase.BYTES_VALUE: {
                return resolve(
                  new StoreGet.BytesResponse(value.getBytesValue_asU8())
                );
              }
              case ValueCase.STRING_VALUE: {
                return resolve(
                  new StoreGet.StringResponse(value.getStringValue())
                );
              }
              case ValueCase.INTEGER_VALUE: {
                return resolve(
                  new StoreGet.IntegerResponse(value.getIntegerValue())
                );
              }
              case ValueCase.DOUBLE_VALUE: {
                return resolve(
                  new StoreGet.DoubleResponse(value.getDoubleValue())
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
    value: string | number | Uint8Array
  ): Promise<StoreSet.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new StoreSet.Error(err)
      );
    }
    this.logger.trace(`Issuing 'set' request; key: ${key.toString()}`);
    const result = await this.sendSet(
      storeName,
      convertToB64String(key),
      value
    );
    this.logger.trace(`'set' request result: ${result.toString()}`);
    return result;
  }

  private async sendSet(
    storeName: string,
    key: string,
    passedInVal: string | number | Uint8Array
  ): Promise<StoreSet.Response> {
    const request = new _StoreSetRequest();
    request.setKey(key);

    const value = new _StoreValue();
    if (typeof passedInVal === 'string') {
      value.setStringValue(passedInVal);
    } else if (typeof passedInVal === 'number') {
      if (Number.isInteger(passedInVal)) {
        value.setIntegerValue(passedInVal);
      } else {
        value.setDoubleValue(passedInVal);
      }
    } else {
      value.setBytesValue(passedInVal);
    }

    return await new Promise((resolve, reject) => {
      this.clientWrapper.set(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createStorageMetadata(storeName, this.deadlineMillis),
        },
        (err, resp) => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StoreSet.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new StoreSet.Success());
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
    this.logger.trace(`Issuing 'delete' request; key: ${key.toString()}`);
    const result = await this.sendDelete(storeName, convertToB64String(key));
    this.logger.trace(`'delete' request result: ${result.toString()}`);
    return result;
  }

  private async sendDelete(
    storeName: string,
    key: string
  ): Promise<StoreDelete.Response> {
    const request = new _StoreDeleteRequest();
    request.setKey(key);

    return await new Promise((resolve, reject) => {
      this.clientWrapper.delete(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createStorageMetadata(storeName, this.deadlineMillis),
        },
        (err, resp) => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new StoreDelete.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new StoreDelete.Success());
          }
        }
      );
    });
  }
}
