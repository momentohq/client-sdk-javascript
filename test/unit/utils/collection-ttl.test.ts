import {CollectionTtl} from '../../../src/utils/collection-ttl';

const ttl = 1.23;

describe('CollectionTtl', () => {
  describe('.fromCacheTtl', () => {
    test('refreshTtl is true, ttl is null', () => {
      const cttl = CollectionTtl.fromCacheTtl();

      expect(cttl.refreshTtl()).toBe(true);
      expect(cttl.ttlSeconds()).toBe(null);
    });
  });

  describe('.of', () => {
    test('refreshTtl is true, ttl is set', () => {
      const cttl = CollectionTtl.of(ttl);

      expect(cttl.refreshTtl()).toBe(true);
      expect(cttl.ttlSeconds()).toEqual(ttl);
    });
  });

  describe('.refreshTtlIfProvided', () => {
    test('with no ttl, refreshTtl is false', () => {
      const cttl = CollectionTtl.refreshTtlIfProvided();

      expect(cttl.refreshTtl()).toBe(false);
      expect(cttl.ttlSeconds()).toBe(null);
    });

    test('with a ttl, refreshTtl is true', () => {
      const cttl = CollectionTtl.refreshTtlIfProvided(ttl);

      expect(cttl.refreshTtl()).toBe(true);
      expect(cttl.ttlSeconds()).toEqual(ttl);
    });
  });

  describe('#withRefreshTtlOnUpdates', () => {
    test('sets refreshTtl true, keeps ttl', () => {
      const cttl = new CollectionTtl(ttl, false);
      const cttl2 = cttl.withRefreshTtlOnUpdates();

      expect(cttl2.ttlSeconds()).toEqual(ttl);
      expect(cttl2.refreshTtl()).toBe(true);
    });
  });

  describe('#withNoRefreshTtlOnUpdates', () => {
    test('sets refreshTtl false, keeps ttl', () => {
      const cttl = new CollectionTtl(ttl, true);
      const cttl2 = cttl.withNoRefreshTtlOnUpdates();

      expect(cttl2.ttlSeconds()).toEqual(ttl);
      expect(cttl2.refreshTtl()).toBe(false);
    });
  });

  describe('#ttlMilliseconds', () => {
    test('converts to milliseconds', () => {
      const cttl = new CollectionTtl(1.23);

      expect(cttl.ttlMilliseconds()).toEqual(1230);
    });

    test('handles null', () => {
      const cttl = new CollectionTtl();

      expect(cttl.ttlMilliseconds()).toBe(null);
    });
  });

  describe('#toString', () => {
    test('when ttlSeconds is null', () => {
      const cttl = new CollectionTtl(null, true);

      expect(cttl.toString()).toMatch('ttl: null, refreshTtl: true');
    });

    test('when ttlSeconds is set', () => {
      const cttl = new CollectionTtl(1.23, false);

      expect(cttl.toString()).toMatch('ttl: 1.23, refreshTtl: false');
    });
  });
});
