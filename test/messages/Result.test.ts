import {
  MomentoCacheResult,
  momentoResultConverter,
} from '../../src/messages/Result';
import {cache} from '@momento/wire-types-typescript';

describe('Result.ts', () => {
  it('should map ECacheResult.Service_Unavailable to MomentoResult.Service_Unavailable', () => {
    expect(
      momentoResultConverter(
        cache.cache_client.ECacheResult.Service_Unavailable
      )
    ).toEqual(MomentoCacheResult.Service_Unavailable);
  });
  it('should map ECacheResult.Bad_Request to MomentoResult.Bad_Request', () => {
    expect(
      momentoResultConverter(cache.cache_client.ECacheResult.Bad_Request)
    ).toEqual(MomentoCacheResult.Bad_Request);
  });
  it('should map ECacheResult.Miss to MomentoResult.Miss', () => {
    expect(
      momentoResultConverter(cache.cache_client.ECacheResult.Miss)
    ).toEqual(MomentoCacheResult.Miss);
  });
  it('should map ECacheResult.Hit to MomentoResult.Hit', () => {
    expect(momentoResultConverter(cache.cache_client.ECacheResult.Hit)).toEqual(
      MomentoCacheResult.Hit
    );
  });
  it('should map ECacheResult.Ok to MomentoResult.Ok', () => {
    expect(momentoResultConverter(cache.cache_client.ECacheResult.Ok)).toEqual(
      MomentoCacheResult.Ok
    );
  });
  it('should map ECacheResult.Unauthorized to MomentoResult.Unauthorized', () => {
    expect(
      momentoResultConverter(cache.cache_client.ECacheResult.Unauthorized)
    ).toEqual(MomentoCacheResult.Unauthorized);
  });
  it('should map ECacheResult.Internal_Server_Error to MomentoResult.Internal_Server_Error', () => {
    expect(
      momentoResultConverter(
        cache.cache_client.ECacheResult.Internal_Server_Error
      )
    ).toEqual(MomentoCacheResult.Internal_Server_Error);
  });
});
