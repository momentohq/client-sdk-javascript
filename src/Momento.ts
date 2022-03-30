import {control} from '@gomomento/generated-types';
import {addHeadersInterceptor} from './grpc/AddHeadersInterceptor';
import {ClientTimeoutInterceptor} from './grpc/ClientTimeoutInterceptor';
import {
  InvalidArgumentError,
  AlreadyExistsError,
  NotFoundError,
} from './Errors';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {cacheServiceErrorMapper} from './CacheServiceErrorMapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {DeleteCacheResponse} from './messages/DeleteCacheResponse';
import {CreateCacheResponse} from './messages/CreateCacheResponse';
import {ListCachesResponse} from './messages/ListCachesResponse';
import {version} from '../package.json';

export interface MomentoProps {
  authToken: string;
  endpoint: string;
}

export class Momento {
  private readonly client: control.control_client.ScsControlClient;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;

  /**
   * @param {MomentoProps} props
   */
  constructor(props: MomentoProps) {
    const headers = [
      {
        name: 'Authorization',
        value: props.authToken,
      },
      {
        name: 'Agent',
        value: `javascript:${version}`,
      },
    ];
    this.interceptors = [
      addHeadersInterceptor(headers),
      ClientTimeoutInterceptor(Momento.REQUEST_TIMEOUT_MS),
    ];
    this.client = new control.control_client.ScsControlClient(
      props.endpoint,
      ChannelCredentials.createSsl()
    );
  }

  public async createCache(name: string): Promise<CreateCacheResponse> {
    this.validateCacheName(name);
    const request = new control.control_client._CreateCacheRequest({
      cache_name: name,
    });
    return await new Promise<CreateCacheResponse>((resolve, reject) => {
      this.client.CreateCache(
        request,
        {interceptors: this.interceptors},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            if (err.code === Status.ALREADY_EXISTS) {
              reject(
                new AlreadyExistsError(
                  `cache with name: ${name} already exists`
                )
              );
            } else {
              reject(cacheServiceErrorMapper(err));
            }
          } else {
            resolve(new CreateCacheResponse());
          }
        }
      );
    });
  }

  public async deleteCache(name: string): Promise<DeleteCacheResponse> {
    const request = new control.control_client._DeleteCacheRequest({
      cache_name: name,
    });
    return await new Promise<DeleteCacheResponse>((resolve, reject) => {
      this.client.DeleteCache(
        request,
        {interceptors: this.interceptors},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (err, resp) => {
          if (err) {
            if (err.code === Status.NOT_FOUND) {
              reject(
                new NotFoundError(`cache with name: ${name} does not exist`)
              );
            } else {
              reject(cacheServiceErrorMapper(err));
            }
          } else {
            resolve(new DeleteCacheResponse());
          }
        }
      );
    });
  }

  public async listCaches(nextToken?: string): Promise<ListCachesResponse> {
    const request = new control.control_client._ListCachesRequest();
    request.next_token = nextToken ?? '';
    return await new Promise<ListCachesResponse>((resolve, reject) => {
      this.client.ListCaches(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err) {
            reject(cacheServiceErrorMapper(err));
          } else {
            resolve(new ListCachesResponse(resp));
          }
        }
      );
    });
  }

  private validateCacheName = (name: string) => {
    if (!name.trim()) {
      throw new InvalidArgumentError('cache name must not be empty');
    }
  };
}
