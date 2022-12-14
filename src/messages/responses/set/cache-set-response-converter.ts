import {CacheSetResponse} from './cache-set-response';
import * as CacheSet from './cache-set';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';
import _SetResponse = cache_client._SetResponse;

export function createCacheSetResponse(
  response: _SetResponse,
  value: Uint8Array
): CacheSetResponse {
  switch (response.result) {
    case cache_client.ECacheResult.Ok:
      return new CacheSet.Success(value);
    case cache_client.ECacheResult.Invalid:
      return new CacheSet.Error(response.message);
    default:
      return new CacheSet.Error(
        'An unknown error occurred: ' + response.message
      );
  }
}
