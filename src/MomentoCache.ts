import {cache} from '@momento/wire-types-typescript';
import {TextEncoder} from 'util';
import {addHeadersInterceptor} from './grpc/AddHeadersInterceptor';
import {MomentoCacheResult, momentoResultConverter} from './messages/Result';
import {
  InternalServerError,
  InvalidArgumentError,
  MomentoServiceError,
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
   * @param {string} key - utf-8 string key
   * @param {string} value - utf-8 string to store in the cache
   * @param {number=} ttl - time to live in cache, in seconds
   * @returns Promise<SetResponse>
   */
  public set(key: string, value: string, ttl?: number): Promise<SetResponse> {
    this.ensureValidSetRequest(key, value, ttl || this.defaultTtlSeconds);
    const encodedKey = this.textEncoder.encode(key);
    const encodedValue = this.textEncoder.encode(value);

    return this.sendSet(
      encodedKey,
      encodedValue,
      ttl || this.defaultTtlSeconds
    );
  }

  /**
   * @param {Uint8Array} key - the cache key
   * @param {Uint8Array} value - the value to store in the cache
   * @param {number=} ttl - time to live in cache, in seconds
   * @returns Promise<SetResponse>
   */
  public setBytes(
    key: Uint8Array,
    value: Uint8Array,
    ttl?: number
  ): Promise<SetResponse> {
    try {
      this.ensureValidSetRequest(key, value, ttl || this.defaultTtlSeconds);
    } catch (e) {
      return Promise.reject(e);
    }
    return this.sendSet(key, value, ttl || this.defaultTtlSeconds);
  }

  private sendSet(
    key: Uint8Array,
    value: Uint8Array,
    ttl: number
  ): Promise<SetResponse> {
    const request = new cache.cache_client.SetRequest({
      cache_body: value,
      cache_key: key,
      ttl_milliseconds: ttl * 1000,
    });
    return new Promise((resolve, reject) => {
      this.client.Set(
        request,
        {interceptors: this.interceptors},
        (err, resp) => {
          if (resp) {
            const momentoResult = momentoResultConverter(resp.result);
            if (momentoResult !== MomentoCacheResult.Ok) {
              reject(new MomentoServiceError(resp.message));
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
   * @param {string} key - utf-8 string key
   * @returns Promise<GetResponse>
   */
  public get(key: string): Promise<GetResponse> {
    try {
      this.ensureValidKey(key);
    } catch (e) {
      return Promise.reject(e);
    }
    return this.sendGet(this.textEncoder.encode(key));
  }

  /**
   * @param {Uint8Array} key
   * @returns Promise<GetResponse>
   */
  public getBytes(key: Uint8Array): Promise<GetResponse> {
    try {
      this.ensureValidKey(key);
    } catch (e) {
      return Promise.reject(e);
    }

    return this.sendGet(key);
  }

  private sendGet(key: Uint8Array): Promise<GetResponse> {
    const request = new cache.cache_client.GetRequest({
      cache_key: key,
    });

    return new Promise((resolve, reject) => {
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
              reject(new MomentoServiceError(resp.message));
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
