import {
  MomentoCacheResult,
  momentoResultConverter,
} from '../../src/messages/Result';
import {cache} from '@momento/wire-types-javascript';

describe('Result.ts', () => {
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
  it('should map ECacheResult.Invalid to MomentoResult.Unknown', () => {
    expect(
      momentoResultConverter(cache.cache_client.ECacheResult.Invalid)
    ).toEqual(MomentoCacheResult.Unknown);
  });
});
