import {cache} from '@gomomento/generated-types';
import {CacheGetResponse} from './cache-get-response';
import * as CacheGet from './cache-get';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';
import _GetResponse = cache_client._GetResponse;

export function createCacheGetResponse(
  response: _GetResponse
): CacheGetResponse {
  switch (response.result) {
    case cache.cache_client.ECacheResult.Miss:
      return new CacheGet.Miss();
    case cache.cache_client.ECacheResult.Hit:
      return new CacheGet.Hit(response.cache_body);
    case cache_client.ECacheResult.Invalid:
      return new CacheGet.Error(response.message);
    case cache_client.ECacheResult.Ok:
      return new CacheGet.Error(response.message);
    default:
      return new CacheGet.Error("D'oh");
  }
}
