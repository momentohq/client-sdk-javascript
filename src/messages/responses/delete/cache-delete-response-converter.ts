import {CacheDeleteResponse} from './cache-delete-response';
import * as CacheDelete from './cache-delete';
import {cache_client} from '@gomomento/generated-types/dist/cacheclient';
import _DeleteResponse = cache_client._DeleteResponse;

export function createCacheDeleteResponse(
  response: _DeleteResponse
): CacheDeleteResponse {
  return new CacheDelete.Success();
}
