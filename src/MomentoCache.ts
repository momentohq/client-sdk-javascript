import {cache} from '@gomomento/generated-types';
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextEncoder} from 'util';
import {Header, HeaderInterceptor} from './grpc/HeadersInterceptor';
import {ClientTimeoutInterceptor} from './grpc/ClientTimeoutInterceptor';
import {CacheGetStatus, momentoResultConverter} from './messages/Result';
import {InvalidArgumentError, UnknownServiceError} from './Errors';
import {cacheServiceErrorMapper} from './CacheServiceErrorMapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {GetResponse} from './messages/GetResponse';
import {SetResponse} from './messages/SetResponse';
import {version} from '../package.json';
import {DeleteResponse} from './messages/DeleteResponse';
import {RetryInterceptor} from './grpc/RetryInterceptor';
import {getLogger, Logger, LoggerOptions} from './utils/logging';

/**
 * @property {string} authToken - momento jwt token
 * @property {string} endpoint - endpoint to reach momento cache
 * @property {number} defaultTtlSeconds - the default time to live of object inside of cache, in seconds
 * @property {number} requestTimeoutMs - the amount of time for a request to complete before timing out, in milliseconds
 */
type MomentoCacheProps = {
  authToken: string;
  endpoint: string;
  defaultTtlSeconds: number;
  requestTimeoutMs?: number;
  loggerOptions?: LoggerOptions;
};

export class MomentoCache {
  private readonly client: cache.cache_client.ScsClient;
  private readonly textEncoder: TextEncoder;
  private readonly defaultTtlSeconds: number;
  private readonly requestTimeoutMs: number;
  private readonly authToken: string;
  private readonly endpoint: string;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;
  private static isUserAgentSent = false;
  private readonly logger: Logger;
  private readonly loggerOptions: LoggerOptions | undefined;

  /**
   * @param {MomentoCacheProps} props
   */
  constructor(props: MomentoCacheProps) {
    this.loggerOptions = props.loggerOptions;
    this.logger = getLogger(this.constructor.name, props.loggerOptions);
    this.validateRequestTimeout(props.requestTimeoutMs);
    this.client = new cache.cache_client.ScsClient(
      props.endpoint,
      ChannelCredentials.createSsl()
    );
    this.textEncoder = new TextEncoder();
    this.defaultTtlSeconds = props.defaultTtlSeconds;
    this.requestTimeoutMs =
      props.requestTimeoutMs || MomentoCache.DEFAULT_REQUEST_TIMEOUT_MS;
    this.authToken = props.authToken;
    this.endpoint = props.endpoint;
  }

  public getEndpoint(): string {
    this.logger.debug(`Using cache endpoint: ${this.endpoint}`);
    return this.endpoint;
  }

  private validateRequestTimeout(timeout?: number) {
    this.logger.debug(`Request timeout: ${this.endpoint}`);
    if (timeout && timeout <= 0) {
      throw new InvalidArgumentError(
        'request timeout must be greater than zero.'
      );
    }
  }

  public async set(
    cacheName: string,
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<SetResponse> {
    this.ensureValidSetRequest(key, value, ttl || this.defaultTtlSeconds);
    this.logger.debug(
      `Issuing 'set' request; key: ${key.toString()}, value: ${value.toString()}, ttl: ${
        ttl?.toString() ?? 'null'
      }`
    );
    const encodedKey = this.convert(key);
    const encodedValue = this.convert(value);

    return await this.sendSet(
      cacheName,
      encodedKey,
      encodedValue,
      ttl || this.defaultTtlSeconds
    );
  }

  private async sendSet(
    cacheName: string,
    key: Uint8Array,
    value: Uint8Array,
    ttl: number
  ): Promise<SetResponse> {
    const request = new cache.cache_client._SetRequest({
      cache_body: value,
      cache_key: key,
      ttl_milliseconds: ttl * 1000,
    });
    return await new Promise((resolve, reject) => {
      this.client.Set(
        request,
        {
          interceptors: this.getInterceptors(cacheName),
        },
        (err, resp) => {
          if (resp) {
            resolve(this.parseSetResponse(resp, value));
          } else {
            reject(cacheServiceErrorMapper(err));
          }
        }
      );
    });
  }

  public async delete(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<DeleteResponse> {
    this.ensureValidKey(key);
    this.logger.debug(`Issuing 'delete' request; key: ${key.toString()}`);
    return await this.sendDelete(cacheName, this.convert(key));
  }

  private async sendDelete(
    cacheName: string,
    key: Uint8Array
  ): Promise<DeleteResponse> {
    const request = new cache.cache_client._DeleteRequest({
      cache_key: key,
    });
    return await new Promise((resolve, reject) => {
      this.client.Delete(
        request,
        {
          interceptors: this.getInterceptors(cacheName),
        },
        (err, resp) => {
          if (resp) {
            resolve(new DeleteResponse());
          } else {
            reject(cacheServiceErrorMapper(err));
          }
        }
      );
    });
  }

  public async get(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<GetResponse> {
    this.ensureValidKey(key);
    this.logger.debug(`Issuing 'get' request; key: ${key.toString()}`);
    const result = await this.sendGet(cacheName, this.convert(key));
    this.logger.debug(`'get' request result: ${JSON.stringify(result)}`);
    return result;
  }

  private async sendGet(
    cacheName: string,
    key: Uint8Array
  ): Promise<GetResponse> {
    const request = new cache.cache_client._GetRequest({
      cache_key: key,
    });

    return await new Promise((resolve, reject) => {
      this.client.Get(
        request,
        {
          interceptors: this.getInterceptors(cacheName),
        },
        (err, resp) => {
          if (resp) {
            const momentoResult = momentoResultConverter(resp.result);
            if (
              momentoResult !== CacheGetStatus.Miss &&
              momentoResult !== CacheGetStatus.Hit
            ) {
              reject(new UnknownServiceError(resp.message));
            }
            resolve(this.parseGetResponse(resp));
          } else {
            reject(cacheServiceErrorMapper(err));
          }
        }
      );
    });
  }

  private parseGetResponse = (
    resp: cache.cache_client._GetResponse
  ): GetResponse => {
    const momentoResult = momentoResultConverter(resp.result);
    return new GetResponse(momentoResult, resp.message, resp.cache_body);
  };

  private parseSetResponse = (
    resp: cache.cache_client._SetResponse,
    value: Uint8Array
  ): SetResponse => {
    return new SetResponse(resp.message, value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ensureValidKey = (key: any) => {
    if (!key) {
      throw new InvalidArgumentError('key must not be empty');
    }
  };

  private getInterceptors(cacheName: string): Interceptor[] {
    const headers = [
      new Header('Authorization', this.authToken),
      new Header('cache', cacheName),
      new Header('Agent', `javascript:${version}`),
    ];
    return [
      new HeaderInterceptor(headers).addHeadersInterceptor(),
      ClientTimeoutInterceptor(this.requestTimeoutMs),
      new RetryInterceptor({
        loggerOptions: this.loggerOptions,
      }).addRetryInterceptor(),
    ];
  }

  private convert(v: string | Uint8Array): Uint8Array {
    if (typeof v === 'string') {
      return this.textEncoder.encode(v);
    }
    return v;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ensureValidSetRequest(key: any, value: any, ttl: number) {
    this.ensureValidKey(key);

    if (!value) {
      throw new InvalidArgumentError('value must not be empty');
    }

    if (ttl && ttl < 0) {
      throw new InvalidArgumentError('ttl must be a positive integer');
    }
  }
}
