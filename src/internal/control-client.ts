import {control} from '@gomomento/generated-types';
import grpcControl = control.control_client;
import {Header, HeaderInterceptor} from '../grpc/headers-interceptor';
import {ClientTimeoutInterceptor} from '../grpc/client-timeout-interceptor';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {cacheServiceErrorMapper} from '../errors/cache-service-error-mapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {
  Configuration,
  CreateCache,
  CredentialProvider,
  DeleteCache,
  ListCaches,
  CreateSigningKey,
  ListSigningKeys,
  RevokeSigningKey,
} from '..';
import {version} from '../../package.json';
import {getLogger, Logger} from '../utils/logging';
import {IdleGrpcClientWrapper} from '../grpc/idle-grpc-client-wrapper';
import {GrpcClientWrapper} from '../grpc/grpc-client-wrapper';
import {normalizeSdkError} from '../errors/error-utils';
import {validateCacheName, validateTtlMinutes} from '../utils/validators';

export interface ControlClientProps {
  configuration: Configuration;
  credentialProvider: CredentialProvider;
}

export class ControlClient {
  private readonly clientWrapper: GrpcClientWrapper<grpcControl.ScsControlClient>;
  private readonly interceptors: Interceptor[];
  private static readonly REQUEST_TIMEOUT_MS: number = 60 * 1000;
  private readonly logger: Logger;

  /**
   * @param {ControlClientProps} props
   */
  constructor(props: ControlClientProps) {
    this.logger = getLogger(this);
    const headers = [
      new Header('Authorization', props.credentialProvider.getAuthToken()),
      new Header('Agent', `javascript:${version}`),
    ];
    this.interceptors = [
      new HeaderInterceptor(headers).addHeadersInterceptor(),
      ClientTimeoutInterceptor(ControlClient.REQUEST_TIMEOUT_MS),
    ];
    this.logger.debug(
      `Creating control client using endpoint: '${props.credentialProvider.getControlEndpoint()}`
    );
    this.clientWrapper = new IdleGrpcClientWrapper({
      clientFactoryFn: () =>
        new grpcControl.ScsControlClient(
          props.credentialProvider.getControlEndpoint(),
          ChannelCredentials.createSsl()
        ),
      configuration: props.configuration,
    });
  }

  public async createCache(name: string): Promise<CreateCache.Response> {
    try {
      validateCacheName(name);
    } catch (err) {
      return new CreateCache.Error(normalizeSdkError(err as Error));
    }
    this.logger.info(`Creating cache: ${name}`);
    const request = new grpcControl._CreateCacheRequest({
      cache_name: name,
    });
    return await new Promise<CreateCache.Response>(resolve => {
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

  public async deleteCache(name: string): Promise<DeleteCache.Response> {
    try {
      validateCacheName(name);
    } catch (err) {
      return new DeleteCache.Error(normalizeSdkError(err as Error));
    }
    const request = new grpcControl._DeleteCacheRequest({
      cache_name: name,
    });
    this.logger.info(`Deleting cache: ${name}`);
    return await new Promise<DeleteCache.Response>(resolve => {
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

  public async listCaches(nextToken?: string): Promise<ListCaches.Response> {
    const request = new grpcControl._ListCachesRequest();
    request.next_token = nextToken ?? '';
    this.logger.debug("Issuing 'listCaches' request");
    return await new Promise<ListCaches.Response>(resolve => {
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
  ): Promise<CreateSigningKey.Response> {
    try {
      validateTtlMinutes(ttlMinutes);
    } catch (err) {
      return new CreateSigningKey.Error(normalizeSdkError(err as Error));
    }
    this.logger.debug("Issuing 'createSigningKey' request");
    const request = new grpcControl._CreateSigningKeyRequest();
    request.ttl_minutes = ttlMinutes;
    return await new Promise<CreateSigningKey.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .CreateSigningKey(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err) {
              resolve(new CreateSigningKey.Error(cacheServiceErrorMapper(err)));
            } else {
              resolve(new CreateSigningKey.Success(endpoint, resp));
            }
          }
        );
    });
  }

  public async revokeSigningKey(
    keyId: string
  ): Promise<RevokeSigningKey.Response> {
    const request = new grpcControl._RevokeSigningKeyRequest();
    request.key_id = keyId;
    this.logger.debug("Issuing 'revokeSigningKey' request");
    return await new Promise<RevokeSigningKey.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .RevokeSigningKey(request, {interceptors: this.interceptors}, err => {
          if (err) {
            resolve(new RevokeSigningKey.Error(cacheServiceErrorMapper(err)));
          } else {
            resolve(new RevokeSigningKey.Success());
          }
        });
    });
  }

  public async listSigningKeys(
    endpoint: string,
    nextToken?: string
  ): Promise<ListSigningKeys.Response> {
    const request = new grpcControl._ListSigningKeysRequest();
    request.next_token = nextToken ?? '';
    this.logger.debug("Issuing 'listSigningKeys' request");
    return await new Promise<ListSigningKeys.Response>(resolve => {
      this.clientWrapper
        .getClient()
        .ListSigningKeys(
          request,
          {interceptors: this.interceptors},
          (err, resp) => {
            if (err) {
              resolve(new ListSigningKeys.Error(cacheServiceErrorMapper(err)));
            } else {
              resolve(new ListSigningKeys.Success(endpoint, resp));
            }
          }
        );
    });
  }
}
