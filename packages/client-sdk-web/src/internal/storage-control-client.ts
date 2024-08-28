import {control} from '@gomomento/generated-types-webtext';
import {
  MomentoLogger,
  CreateStore,
  DeleteStore,
  ListStores,
  StoreInfo,
  MomentoErrorCode,
} from '..';
import {Request, UnaryResponse} from 'grpc-web';
import {
  _CreateStoreRequest,
  _DeleteStoreRequest,
  _ListStoresRequest,
} from '@gomomento/generated-types-webtext/dist/controlclient_pb';
import {IStorageControlClient} from '@gomomento/sdk-core/dist/src/internal/clients';
import {validateStoreName} from '@gomomento/sdk-core/dist/src/internal/utils';
import {getWebControlEndpoint} from '../utils/web-client-utils';
import {ClientMetadataProvider} from './client-metadata-provider';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {StorageClientAllProps} from './storage-client-all-props';

export class StorageControlClient<
  REQ extends Request<REQ, RESP>,
  RESP extends UnaryResponse<REQ, RESP>
> implements IStorageControlClient
{
  private readonly clientWrapper: control.ScsControlClient;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;

  private readonly clientMetadataProvider: ClientMetadataProvider;

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: StorageClientAllProps) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(false);
    this.logger.debug(
      `Creating storage control client using endpoint: '${getWebControlEndpoint(
        props.credentialProvider
      )}`
    );

    this.clientMetadataProvider = new ClientMetadataProvider({
      authToken: props.credentialProvider.getAuthToken(),
      clientType: 'store',
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

  public async createStore(name: string): Promise<CreateStore.Response> {
    try {
      validateStoreName(name);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new CreateStore.Error(err)
      );
    }
    this.logger.debug(`Creating store: ${name}`);
    const request = new _CreateStoreRequest();
    request.setStoreName(name);

    return await new Promise<CreateStore.Response>((resolve, reject) => {
      this.clientWrapper.createStore(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, _resp) => {
          if (err) {
            const sdkError = this.cacheServiceErrorMapper.convertError(err);
            if (
              sdkError.errorCode() ===
              MomentoErrorCode.STORE_ALREADY_EXISTS_ERROR
            ) {
              return resolve(new CreateStore.AlreadyExists());
            } else {
              this.cacheServiceErrorMapper.resolveOrRejectError({
                err: err,
                errorResponseFactoryFn: e => new CreateStore.Error(e),
                resolveFn: resolve,
                rejectFn: reject,
              });
            }
          } else {
            resolve(new CreateStore.Success());
          }
        }
      );
    });
  }

  public async deleteStore(name: string): Promise<DeleteStore.Response> {
    try {
      validateStoreName(name);
    } catch (err) {
      return this.cacheServiceErrorMapper.returnOrThrowError(
        err as Error,
        err => new DeleteStore.Error(err)
      );
    }
    const request = new _DeleteStoreRequest();
    request.setStoreName(name);
    this.logger.debug(`Deleting store: ${name}`);
    return await new Promise<DeleteStore.Response>((resolve, reject) => {
      this.clientWrapper.deleteStore(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, _resp) => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new DeleteStore.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            resolve(new DeleteStore.Success());
          }
        }
      );
    });
  }

  public async listStores(): Promise<ListStores.Response> {
    const request = new _ListStoresRequest();
    request.setNextToken('');
    this.logger.debug("Issuing 'listStores' request");
    return await new Promise<ListStores.Response>((resolve, reject) => {
      this.clientWrapper.listStores(
        request,
        this.clientMetadataProvider.createClientMetadata(),
        (err, resp) => {
          if (err) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new ListStores.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            const stores = resp.getStoreList().map(store => {
              const storeName = store.getStoreName();
              return new StoreInfo(storeName);
            });
            resolve(new ListStores.Success(stores));
          }
        }
      );
    });
  }
}
