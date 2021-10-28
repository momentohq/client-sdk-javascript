import {cache} from '@momento/wire-types-typescript';
// older versions of node don't have the global util variables https://github.com/nodejs/node/issues/20365
import {TextEncoder} from 'util';
import {addHeadersInterceptor} from './grpc/AddHeadersInterceptor';
import {MomentoCacheResult, momentoResultConverter} from './messages/Result';
import {
  InternalServerError,
  InvalidArgumentError,
  UnknownServiceError,
} from './Errors';
import {cacheServiceErrorMapper} from './CacheServiceErrorMapper';
import {ChannelCredentials, Interceptor} from '@grpc/grpc-js';
import {GetResponse} from './messages/GetResponse';
import {SetResponse} from './messages/SetResponse';

const delay = (millis: number): Promise<void> => {
  return new Promise<void>(resolve => {
    setTimeout(() => resolve(), millis);
  });
};

/**
 * @property {string} authToken - momento jwt token
 * @property {string} cacheName - name of the cache to perform gets and sets against
 * @property {string} endpoint - endpoint to reach momento cache
 * @property {number} defaultTtlSeconds - the default time to live of object inside of cache, in seconds
 */
type MomentoCacheProps = {
  authToken: string;
  cacheName: string;
  endpoint: string;
  defaultTtlSeconds: number;
};

export class MomentoCache {
  private readonly client: cache.cache_client.ScsClient;
  private readonly textEncoder: TextEncoder;
  private readonly interceptors: Interceptor[];
  private readonly cacheName: string;
  private readonly defaultTtlSeconds: number;

  /**
   * @param {MomentoCacheProps} props
   */
  protected constructor(props: MomentoCacheProps) {
    this.client = new cache.cache_client.ScsClient(
      props.endpoint,
      ChannelCredentials.createSsl()
    );
    this.textEncoder = new TextEncoder();
    this.cacheName = props.cacheName;
    this.defaultTtlSeconds = props.defaultTtlSeconds;
    const headers = [
      {
        name: 'Authorization',
        value: props.authToken,
      },
      {
        name: 'cache',
        value: props.cacheName,
      },
    ];
    this.interceptors = [addHeadersInterceptor(headers)];
  }

  /**
   * This method should not be called directly. Instead, it should be called by the Momento class when calling Momento.getCache
   * @param {MomentoCacheProps} props
   * @returns Promise<MomentoCache>
   */
  static async init(props: MomentoCacheProps): Promise<MomentoCache> {
    const cache = new MomentoCache(props);
    await cache.waitForCacheReady();
    return cache;
  }

  /**
   * temporary work around to allow for users to create a cache, and then immediately call get/set on it
   * @private
   */
  private async waitForCacheReady(): Promise<void> {
    const key = '00000';
    const maxWaitDuration = 5000;
    const start = Date.now();
    const backoffMillis = 50;
    let lastError = null;

    while (Date.now() - start < maxWaitDuration) {
      try {
        await this.get(key);
        return;
      } catch (e: any) {
        if (e instanceof InternalServerError) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          lastError = e;
          await delay(backoffMillis);
        } else {
          throw e;
        }
      }
    }
    throw lastError;
  }

  /**
   * @param {string | Uint8Array} key
   * @param {string | Uint8Array} value
   * @param {number=} ttl - time to live in cache, in seconds
   * @returns Promise<SetResponse>
   */
  public async set(
    key: string | Uint8Array,
    value: string | Uint8Array,
    ttl?: number
  ): Promise<SetResponse> {
    this.ensureValidSetRequest(key, value, ttl || this.defaultTtlSeconds);
    const encodedKey = this.convert(key);
    const encodedValue = this.convert(value);

    return await this.sendSet(
      encodedKey,
      encodedValue,
      ttl || this.defaultTtlSeconds
    );
  }

  private async sendSet(
    key: Uint8Array,
    value: Uint8Array,
    ttl: number
  ): Promise<SetResponse> {
    const request = new cache.cache_client.SetRequest({
      cache_body: value,
      cache_key: key,
      ttl_milliseconds: ttl * 1000,
    });
    return await new Promise((resolve, reject) => {
      this.client.Set(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            const momentoResult = momentoResultConverter(resp.result);
            if (momentoResult !== MomentoCacheResult.Ok) {
              reject(new UnknownServiceError(resp.message));
            }
            resolve(this.parseSetResponse(resp));
          } else {
            reject(cacheServiceErrorMapper(err));
          }
        }
      );
    });
  }

  /**
   * @param {string | Uint8Array} key
   * @returns Promise<GetResponse>
   */
  public async get(key: string | Uint8Array): Promise<GetResponse> {
    this.ensureValidKey(key);
    return await this.sendGet(this.convert(key));
  }

  private async sendGet(key: Uint8Array): Promise<GetResponse> {
    const request = new cache.cache_client.GetRequest({
      cache_key: key,
    });

    return await new Promise((resolve, reject) => {
      this.client.Get(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            const momentoResult = momentoResultConverter(resp.result);
            if (
              momentoResult !== MomentoCacheResult.Miss &&
              momentoResult !== MomentoCacheResult.Hit
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
    resp: cache.cache_client.GetResponse
  ): GetResponse => {
    const momentoResult = momentoResultConverter(resp.result);
    return new GetResponse(momentoResult, resp.message, resp.cache_body);
  };

  private parseSetResponse = (
    resp: cache.cache_client.SetResponse
  ): SetResponse => {
    const momentoResult = momentoResultConverter(resp.result);
    return new SetResponse(momentoResult, resp.message);
  };

  private ensureValidKey = (key: any) => {
    if (!key) {
      throw new InvalidArgumentError('key must not be empty');
    }
  };

  private convert(v: string | Uint8Array): Uint8Array {
    if (typeof v === 'string') {
      return this.textEncoder.encode(v);
    }
    return v;
  }

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
