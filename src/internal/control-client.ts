import {control} from '@gomomento/generated-types';
import {Header, HeaderInterceptor} from '../grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from '../grpc/client-timeout-interceptor';
import {createRetryInterceptorIfEnabled} from '../grpc/retry-interceptor';
import {InvalidArgumentError, SdkError, UnknownError} from '../errors/errors';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {DeleteCacheResponse} from '../messages/responses/delete-cache/delete-cache-response';
import {CreateCacheResponse} from '../messages/responses/create-cache/create-cache-response';
import {ListCachesResponse} from '../messages/responses/list-caches/list-caches-response';
import * as CreateCache from '../messages/responses/create-cache/create-cache';
import * as DeleteCache from '../messages/responses/delete-cache/delete-cache';
import * as ListCaches from '../messages/responses/list-caches/list-caches';
import {version} from '../../package.json';
import {CreateSigningKeyResponse} from '../messages/create-signing-key-response';
import {RevokeSigningKeyResponse} from '../messages/revoke-signing-key-response';
import {ListSigningKeysResponse} from '../messages/list-signing-keys-response';
import {getLogger, Logger} from '../utils/logging';
import {IdleGrpcClientWrapper} from '../grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from '../grpc/grpc-client-wrapper';

export interface MomentoProps {
  authToken: string;
  endpoint: string;
}

export class ControlClient {
  private readonly clientWrapper: GrpcClientWrapper<control.control_client.ScsControlClient>;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: Logger;

  /**
   * @param {MomentoProps} props
   */
  constructor(props: MomentoProps) {
    this.logger = getLogger(this);
    const headers = [
      new Header('Authorization', props.authToken),
      new Header('Agent', `javascript:${version}`),
    ];
    this.interceptors = [
      new HeaderInterceptor(headers).addHeadersInterceptor(),
      ClientTimeoutInterceptor(ControlClient.REQUEST_TIMEOUT_MS),
      ...createRetryInterceptorIfEnabled(),
    ];
    this.logger.debug(
      `Creating control client using endpoint: '${props.endpoint}`
    );
    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new control.control_client.ScsControlClient(
          props.endpoint,
          ChannelCredentials.createSsl()
        ),
    });
  }

  public async createCache(name: string): Promise<CreateCacheResponse> {
    try {
      this.validateCacheName(name);
    } catch (err) {
      if (err instanceof SdkError) {
        return new CreateCache.Error(err);
      } else if (err instanceof Error) {
        return new CreateCache.Error(new UnknownError(err.message));
      }
    }
    this.logger.info(`Creating cache: ${name}`);
    const request = new control.control_client._CreateCacheRequest({
      cache_name: name,
    });
    return await new Promise<CreateCacheResponse>((resolve, reject) => {
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

  public async deleteCache(name: string): Promise<DeleteCacheResponse> {
    try {
      this.validateCacheName(name);
    } catch (err) {
      if (err instanceof SdkError) {
        return new DeleteCache.Error(err);
      } else if (err instanceof Error) {
        return new DeleteCache.Error(new UnknownError(err.message));
      }
    }
    const request = new control.control_client._DeleteCacheRequest({
      cache_name: name,
    });
    this.logger.info(`Deleting cache: ${name}`);
    return await new Promise<DeleteCacheResponse>((resolve, reject) => {
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

  public async listCaches(nextToken?: string): Promise<ListCachesResponse> {
    const request = new control.control_client._ListCachesRequest();
    request.next_token = nextToken ?? '';
    this.logger.debug("Issuing 'listCaches' request");
    return await new Promise<ListCachesResponse>((resolve, reject) => {
      this.clientWrapper
        .getClient()
        .ListCaches(request, {interceptors: this.interceptors}, (err, resp) => {
          if (err) {
            resolve(new ListCaches.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(new ListCaches.Success(resp));
          }
        });
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
      this.clientWrapper
        .getClient()
        .CreateSigningKey(
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
      this.clientWrapper
        .getClient()
        .RevokeSigningKey(request, {interceptors: this.interceptors}, err => {
          if (err) {
            reject(cacheServiceErrorMapper(err));
          } else {
            resolve(new RevokeSigningKeyResponse());
          }
        });
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
      this.clientWrapper
        .getClient()
        .ListSigningKeys(
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
