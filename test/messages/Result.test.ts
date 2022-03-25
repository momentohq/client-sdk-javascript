import {
  CacheGetStatus,
  momentoResultConverter,
} from '../../src/messages/Result';
import {cache} from '@gomomento/generated-types';

describe('Result.ts', () => {
  it('should map ECacheResult.Miss to MomentoResult.Miss', () => {
    expect(
      momentoResultConverter(cache.cache_client.ECacheResult.Miss)
    ).toEqual(CacheGetStatus.Miss);
  });
  it('should map ECacheResult.Hit to MomentoResult.Hit', () => {
    expect(momentoResultConverter(cache.cache_client.ECacheResult.Hit)).toEqual(
      CacheGetStatus.Hit
    );
  });
  it('should map ECacheResult.Invalid to MomentoResult.Unknown', () => {
    expect(
      momentoResultConverter(cache.cache_client.ECacheResult.Invalid)
    ).toEqual(CacheGetStatus.Unknown);
  });
});
