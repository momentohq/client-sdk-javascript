import {store} from '@gomomento/generated-types-webtext';
import {
  StorageGet,
  StoragePut,
  StorageDelete,
  CredentialProvider,
  MomentoLogger,
  UnknownError,
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
import {StorageConfiguration} from '../config/storage-configuration';
import {SdkError} from '@gomomento/sdk-core';

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
  private readonly clientMetadataProvider: ClientMetadataProvider;
  // TODO make this part of configuration
  private readonly deadlineMillis: number = 10000;

  /**
   * @param {DataClientProps} props
   */
  constructor(props: StorageDataClientProps) {
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
      return new StorageGet.Error(err as SdkError);
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
                  new StorageGet.BytesResponse(value.getBytesValue_asU8())
                );
              }
              case ValueCase.STRING_VALUE: {
                return resolve(
                  new StorageGet.StringResponse(value.getStringValue())
                );
              }
              case ValueCase.INTEGER_VALUE: {
                return resolve(
                  new StorageGet.IntegerResponse(value.getIntegerValue())
                );
              }
              case ValueCase.DOUBLE_VALUE: {
                return resolve(
                  new StorageGet.DoubleResponse(value.getDoubleValue())
                );
              }
            }
          } else {
            return resolve(new StorageGet.Error(err as unknown as SdkError));
          }
        }
      );
    });
  }

  public async put(
    storeName: string,
    key: string,
    value: string | number | Uint8Array
  ): Promise<StoragePut.Response> {
    try {
      validateStoreName(storeName);
    } catch (err) {
      return new StoragePut.Error(err as SdkError);
    }
    this.logger.trace(`Issuing 'put' request; key: ${key.toString()}`);
    const result = await this.sendPut(
      storeName,
      convertToB64String(key),
      value
    );
    this.logger.trace(`'put' request result: ${result.toString()}`);
    return result;
  }

  private async sendPut(
    storeName: string,
    key: string,
    passedInVal: string | number | Uint8Array
  ): Promise<StoragePut.Response> {
    console.log(
      `storeName: ${storeName} key: ${key} passedInVal: ${
        passedInVal as string
      }`
    );
    const request = new _StorePutRequest();
    request.setKey(key);

    const value = new _StoreValue();
    if (typeof passedInVal === 'string') {
      console.log(`setting string value: ${passedInVal}`);
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
    request.setValue(value);
    return await new Promise((resolve, reject) => {
      this.clientWrapper.put(
        request,
        {
          ...this.clientMetadataProvider.createClientMetadata(),
          ...createStorageMetadata(storeName, this.deadlineMillis),
        },
        (err, _resp) => {
          if (err) {
            return resolve(new StoragePut.Error(err as unknown as SdkError));
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
      return new StorageDelete.Error(err as SdkError);
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
            return resolve(new StorageDelete.Error(err as unknown as SdkError));
          } else {
            resolve(new StorageDelete.Success());
          }
        }
      );
    });
  }
}
