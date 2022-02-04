import {cache} from '@momento/wire-types-javascript';
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextEncoder} from 'util';
import {addHeadersInterceptor} from './grpc/AddHeadersInterceptor';
import {ClientTimeoutInterceptor} from './grpc/ClientTimeoutInterceptor';
import {CacheGetStatus, momentoResultConverter} from './messages/Result';
import {InvalidArgumentError, UnknownServiceError} from './Errors';
import {cacheServiceErrorMapper} from './CacheServiceErrorMapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {GetResponse} from './messages/GetResponse';
import {SetResponse} from './messages/SetResponse';

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
};

export class MomentoCache {
  private readonly client: cache.cache_client.ScsClient;
  private readonly textEncoder: TextEncoder;
  private readonly defaultTtlSeconds: number;
  private readonly requestTimeoutMs: number;
  private readonly authToken: string;
  private static readonly DEFAULT_REQUEST_TIMEOUT_MS: number = 5 * 1000;

  /**
   * @param {MomentoCacheProps} props
   */
  constructor(props: MomentoCacheProps) {
    MomentoCache.validateRequestTimeout(props.requestTimeoutMs);
    this.client = new cache.cache_client.ScsClient(
      props.endpoint,
      ChannelCredentials.createSsl()
    );
    this.textEncoder = new TextEncoder();
    this.defaultTtlSeconds = props.defaultTtlSeconds;
    this.requestTimeoutMs =
      props.requestTimeoutMs || MomentoCache.DEFAULT_REQUEST_TIMEOUT_MS;
    this.authToken = props.authToken;
  }

  private static validateRequestTimeout(timeout?: number) {
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

  public async get(
    cacheName: string,
    key: string | Uint8Array
  ): Promise<GetResponse> {
    this.ensureValidKey(key);
    return await this.sendGet(cacheName, this.convert(key));
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
      {
        name: 'Authorization',
        value: this.authToken,
      },
      {
        name: 'cache',
        value: cacheName,
      },
    ];
    return [
      addHeadersInterceptor(headers),
      ClientTimeoutInterceptor(this.requestTimeoutMs),
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
