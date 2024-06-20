import {control} from '@gomomento/generated-types';
import grpcControl = control.control_client;
import {Header, HeaderInterceptorProvider} from './grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from './grpc/client-timeout-interceptor';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {CacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {MomentoLogger, StoreInfo, ListStores} from '..';
import {version} from '../../package.json';
import {validateStoreName} from '@gomomento/sdk-core/dist/src/internal/utils';
import {CreateStore, DeleteStore} from '@gomomento/sdk-core';
import {StorageClientPropsWithConfig} from './storage-client-props-with-config';

export class StorageControlClient {
  private readonly clientWrapper: grpcControl.ScsControlClient;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: MomentoLogger;
  private readonly cacheServiceErrorMapper: CacheServiceErrorMapper;

  /**
   * @param {StorageClientProps} props
   */
  constructor(props: StorageClientPropsWithConfig) {
    this.logger = props.configuration.getLoggerFactory().getLogger(this);
    this.cacheServiceErrorMapper = new CacheServiceErrorMapper(false);
    const headers = [
      new Header('Authorization', props.credentialProvider.getAuthToken()),
      new Header('Agent', `nodejs:store:${version}`),
    ];
    this.interceptors = [
      new HeaderInterceptorProvider(headers).createHeadersInterceptor(),
      ClientTimeoutInterceptor(StorageControlClient.REQUEST_TIMEOUT_MS),
    ];
    this.logger.debug(
      `Creating storage control client using endpoint: '${props.credentialProvider.getControlEndpoint()}`
    );

    this.clientWrapper = new grpcControl.ScsControlClient(
      props.credentialProvider.getControlEndpoint(),
      props.credentialProvider.isControlEndpointSecure()
        ? ChannelCredentials.createSsl()
        : ChannelCredentials.createInsecure()
    );
  }
  close() {
    this.logger.debug('Closing storage control client');
    this.clientWrapper.close();
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
    const request = new grpcControl._CreateStoreRequest({
      store_name: name,
    });
    return await new Promise<CreateStore.Response>((resolve, reject) => {
      this.clientWrapper.CreateStore(
        request,
        {interceptors: this.interceptors},
        (err, _resp) => {
          if (err) {
            if (err.code === Status.ALREADY_EXISTS) {
              resolve(new CreateStore.AlreadyExists());
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
    const request = new grpcControl._DeleteStoreRequest({
      store_name: name,
    });
    this.logger.debug(`Deleting store: ${name}`);
    return await new Promise<DeleteStore.Response>((resolve, reject) => {
      this.clientWrapper.DeleteStore(
        request,
        {interceptors: this.interceptors},
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
    const request = new grpcControl._ListStoresRequest();
    request.next_token = '';
    this.logger.debug("Issuing 'listStores' request");
    return await new Promise<ListStores.Response>((resolve, reject) => {
      this.clientWrapper.ListStores(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err || !resp) {
            this.cacheServiceErrorMapper.resolveOrRejectError({
              err: err,
              errorResponseFactoryFn: e => new ListStores.Error(e),
              resolveFn: resolve,
              rejectFn: reject,
            });
          } else {
            const stores = resp.store.map(store => {
              const storeName = store.store_name;
              return new StoreInfo(storeName);
            });
            resolve(new ListStores.Success(stores));
          }
        }
      );
    });
  }
}
