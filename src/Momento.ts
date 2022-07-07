import {control} from '@gomomento/generated-types';
import {Header, HeaderInterceptor} from './grpc/HeadersInterceptor';
import {ClientTimeoutInterceptor} from './grpc/ClientTimeoutInterceptor';
import {
  AlreadyExistsError,
  InvalidArgumentError,
  NotFoundError,
} from './Errors';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {cacheServiceErrorMapper} from './CacheServiceErrorMapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {DeleteCacheResponse} from './messages/DeleteCacheResponse';
import {CreateCacheResponse} from './messages/CreateCacheResponse';
import {ListCachesResponse} from './messages/ListCachesResponse';
import {version} from '../package.json';
import {CreateSigningKeyResponse} from './messages/CreateSigningKeyResponse';
import {RevokeSigningKeyResponse} from './messages/RevokeSigningKeyResponse';
import {ListSigningKeysResponse} from './messages/ListSigningKeysResponse';
import {RetryInterceptor} from './grpc/RetryInterceptor';
import {getLogger, Logger, LoggerOptions} from './utils/logging';

export interface MomentoProps {
  authToken: string;
  endpoint: string;
  loggerOptions?: LoggerOptions;
}

export class Momento {
  private readonly client: control.control_client.ScsControlClient;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: Logger;

  /**
   * @param {MomentoProps} props
   */
  constructor(props: MomentoProps) {
    this.logger = getLogger(this.constructor.name, props.loggerOptions);
    const headers = [
      new Header('Authorization', props.authToken),
      new Header('Agent', `javascript:${version}`),
    ];
    this.interceptors = [
      new HeaderInterceptor(headers).addHeadersInterceptor(),
      ClientTimeoutInterceptor(Momento.REQUEST_TIMEOUT_MS),
      new RetryInterceptor({
        loggerOptions: props.loggerOptions,
      }).addRetryInterceptor(),
    ];
    this.client = new control.control_client.ScsControlClient(
      props.endpoint,
      ChannelCredentials.createSsl()
    );
  }

  public async createCache(name: string): Promise<CreateCacheResponse> {
    this.validateCacheName(name);
    this.logger.info(`Creating cache: ${name}`);
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
    this.logger.info(`Deleting cache: ${name}`);
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
    this.logger.debug("Issuing 'listCaches' request");
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

  public async createSigningKey(
    ttlMinutes: number,
    endpoint: string
  ): Promise<CreateSigningKeyResponse> {
    this.validateTtlMinutes(ttlMinutes);
    this.logger.debug("Issuing 'createSigningKey' request");
    const request = new control.control_client._CreateSigningKeyRequest();
    request.ttl_minutes = ttlMinutes;
    return await new Promise<CreateSigningKeyResponse>((resolve, reject) => {
      this.client.CreateSigningKey(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err) {
            reject(cacheServiceErrorMapper(err));
          } else {
            resolve(new CreateSigningKeyResponse(endpoint, resp));
          }
        }
      );
    });
  }

  public async revokeSigningKey(
    keyId: string
  ): Promise<RevokeSigningKeyResponse> {
    const request = new control.control_client._RevokeSigningKeyRequest();
    request.key_id = keyId;
    this.logger.debug("Issuing 'revokeSigningKey' request");
    return await new Promise<RevokeSigningKeyResponse>((resolve, reject) => {
      this.client.RevokeSigningKey(
        request,
        {interceptors: this.interceptors},
        err => {
          if (err) {
            reject(cacheServiceErrorMapper(err));
          } else {
            resolve(new RevokeSigningKeyResponse());
          }
        }
      );
    });
  }

  public async listSigningKeys(
    endpoint: string,
    nextToken?: string
  ): Promise<ListSigningKeysResponse> {
    const request = new control.control_client._ListSigningKeysRequest();
    request.next_token = nextToken ?? '';
    this.logger.debug("Issuing 'listSigningKeys' request");
    return await new Promise<ListSigningKeysResponse>((resolve, reject) => {
      this.client.ListSigningKeys(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (err) {
            reject(cacheServiceErrorMapper(err));
          } else {
            resolve(new ListSigningKeysResponse(endpoint, resp));
          }
        }
      );
    });
  }

  private validateCacheName(name: string) {
    if (!name.trim()) {
      throw new InvalidArgumentError('cache name must not be empty');
    }
  }

  private validateTtlMinutes(ttlMinutes: number) {
    if (ttlMinutes < 0) {
      throw new InvalidArgumentError('ttlMinutes must be positive');
    }
  }
}
