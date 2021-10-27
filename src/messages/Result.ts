import {cache} from '@momento/wire-types-typescript';

export enum MomentoCacheResult {
  Internal_Server_Error = "INTERNAL_SERVER_ERROR",
  Ok = "OK",
  Hit = "HIT",
  Miss = "MISS",
  Bad_Request = "BAD_REQUEST",
  Unauthorized = "UNAUTHORIZED",
  Service_Unavailable = "SERVICE_UNAVAILABLE",
  Unknown = "UNKNOWN",
}

export function momentoResultConverter(
  result: cache.cache_client.ECacheResult
): MomentoCacheResult {
  switch (result) {
    case cache.cache_client.ECacheResult.Service_Unavailable:
      return MomentoCacheResult.Service_Unavailable;
    case cache.cache_client.ECacheResult.Bad_Request:
      return MomentoCacheResult.Bad_Request;
    case cache.cache_client.ECacheResult.Miss:
      return MomentoCacheResult.Miss;
    case cache.cache_client.ECacheResult.Hit:
      return MomentoCacheResult.Hit;
    case cache.cache_client.ECacheResult.Ok:
      return MomentoCacheResult.Ok;
    case cache.cache_client.ECacheResult.Unauthorized:
      return MomentoCacheResult.Unauthorized;
    case cache.cache_client.ECacheResult.Internal_Server_Error:
      return MomentoCacheResult.Internal_Server_Error;
    default:
      return MomentoCacheResult.Unknown;
  }
}
