import {cache} from '@gomomento/generated-types';

export enum CacheGetStatus {
  Hit = 'HIT',
  Miss = 'MISS',
  Unknown = 'UNKNOWN',
}

export function momentoResultConverter(
  result: cache.cache_client.ECacheResult
): CacheGetStatus {
  switch (result) {
    case cache.cache_client.ECacheResult.Miss:
      return CacheGetStatus.Miss;
    case cache.cache_client.ECacheResult.Hit:
      return CacheGetStatus.Hit;
    default:
      return CacheGetStatus.Unknown;
  }
}
