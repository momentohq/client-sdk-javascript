import {cache} from '@momento/wire-types-typescript';

export enum MomentoCacheResult {
  Hit = 'HIT',
  Miss = 'MISS',
  Unknown = 'UNKNOWN',
}

export function momentoResultConverter(
  result: cache.cache_client.ECacheResult
): MomentoCacheResult {
  switch (result) {
    case cache.cache_client.ECacheResult.Miss:
      return MomentoCacheResult.Miss;
    case cache.cache_client.ECacheResult.Hit:
      return MomentoCacheResult.Hit;
    default:
      return MomentoCacheResult.Unknown;
  }
}
