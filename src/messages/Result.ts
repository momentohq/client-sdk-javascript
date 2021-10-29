import {cache} from '@momento/wire-types-typescript';

export enum MomentoCacheResult {
  Ok = 'Ok',
  Hit = 'Hit',
  Miss = 'Miss',
  Unknown = 'Unknown',
}

export function momentoResultConverter(
  result: cache.cache_client.ECacheResult
): MomentoCacheResult {
  switch (result) {
    case cache.cache_client.ECacheResult.Miss:
      return MomentoCacheResult.Miss;
    case cache.cache_client.ECacheResult.Hit:
      return MomentoCacheResult.Hit;
    case cache.cache_client.ECacheResult.Ok:
      return MomentoCacheResult.Ok;
    default:
      return MomentoCacheResult.Unknown;
  }
}
