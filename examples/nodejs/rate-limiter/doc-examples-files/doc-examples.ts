import {
  CacheClient,
  CacheIncrement,
  CacheUpdateTtl,
  Configurations,
  CreateCache,
  CredentialProvider,
} from '@gomomento/sdk';

// since our rate limiting buckets are per minute, we expire keys every minute
export const RATE_LIMITER_TTL_MILLIS = 60000;

export class MomentoRateLimiter {
  _client: CacheClient;
  _limit: number;
  _cacheName: string;

  constructor(client: CacheClient, limit: number, cacheName: string) {
    this._client = client;
    this._limit = limit;
    this._cacheName = cacheName;
  }

  /**
   * Generates a unique key for a user (baseKey) for the current minute. This key will server as the backend
   * cache key where we will store the amount of calls that have been made by a user for a given minute.
   * @param baseKey
   */
  generateMinuteKey(baseKey: string): string {
    const currentDate = new Date();
    const currentMinute = currentDate.getMinutes();
    return `${baseKey}_${currentMinute}`;
  }

  public async isLimitExceeded(id: string): Promise<boolean> {
    const currentMinuteKey = this.generateMinuteKey(id);
    // we do not pass a TTL to this; we don't know if the key for this user was present or not
    const resp = await this._client.increment(
      this._cacheName,
      currentMinuteKey
    );

    if (resp instanceof CacheIncrement.Success) {
      if (resp.value() <= this._limit) {
        // if returned value is 1, we know this was the first request in this minute for the given user. So
        // we set the TTL for this minute's key to 60 seconds now.
        if (resp.value() === 1) {
          const updateTTLResp = await this._client.updateTtl(
            this._cacheName,
            currentMinuteKey,
            RATE_LIMITER_TTL_MILLIS
          );
          if (!(updateTTLResp instanceof CacheUpdateTtl.Set)) {
            console.error(
              `Failed to update TTL; this minute's user requests might be overcounted, key: ${currentMinuteKey}`
            );
          }
        }
        return false;
      }
    } else if (resp instanceof CacheIncrement.Error) {
      throw new Error(resp.message());
    }

    return true;
  }
}

async function main() {
  const cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  });

  const tpmLimit = 1;
  const cacheName = 'rate-limiter';

  const createCacheResp = await cacheClient.createCache(cacheName);
  if (createCacheResp instanceof CreateCache.Error) {
    throw new Error(createCacheResp.message());
  } else if (createCacheResp instanceof CreateCache.AlreadyExists) {
    console.log(`${cacheName} cache already exists`);
  }

  const momentoRateLimier = new MomentoRateLimiter(
    cacheClient,
    tpmLimit,
    cacheName
  );

  const limitExceeded = await momentoRateLimier.isLimitExceeded('user-id');
  if (!limitExceeded) {
    // do work for user
    console.log('Successfully called work and request was allowed');
  } else {
    console.warn('Request was throttled');
  }
}

main()
  .then()
  .catch((err: Error) => console.error(err.message));
