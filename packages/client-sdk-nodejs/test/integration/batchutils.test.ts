import {CacheDelete, CacheGet, CacheSet} from '@gomomento/sdk-core';
import {
  batchDelete,
  batchGet,
  batchSet,
} from '../../src/batchutils/batch-functions';
import {SetupIntegrationTest, delay} from './integration-setup';
import {expectWithMessage} from '@gomomento/common-integration-tests';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

describe('BatchUtils', () => {
  it('batchGet happy path with all misses', async () => {
    const response = await batchGet(cacheClient, integrationTestCacheName, [
      'a',
      'b',
      'c',
      '1',
      '2',
      '3',
    ]);
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS for key ${key}, received ${resp.toString()}`);
    }
  });

  it('batchSet happy path', async () => {
    const response = await batchSet(
      cacheClient,
      integrationTestCacheName,
      ['a', 'b', 'c', '1', '2', '3'],
      ['apple', 'berry', 'cantaloupe', 'first', 'second', 'third']
    );
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS for item ${key} but received ${resp.toString()}`);
    }
  });

  it('batchSet happy path with ttl', async () => {
    const response = await batchSet(
      cacheClient,
      integrationTestCacheName,
      ['a', 'b', 'c', '1', '2', '3'],
      ['apple', 'berry', 'cantaloupe', 'first', 'second', 'third'],
      {ttl: 3}
    );
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS for item ${key} but received ${resp.toString()}`);
    }

    await delay(5000);
    const getResponse = await batchGet(cacheClient, integrationTestCacheName, [
      'a',
      'b',
      'c',
      '1',
      '2',
      '3',
    ]);
    for (const [key, resp] of Object.entries(getResponse)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS for key ${key}, received ${resp.toString()}`);
    }
  });

  it('batchGet happy path with all hits', async () => {
    // Set some values first
    const setResponse = await batchSet(
      cacheClient,
      integrationTestCacheName,
      ['a', 'b', 'c', '1', '2', '3'],
      ['apple', 'berry', 'cantaloupe', 'first', 'second', 'third']
    );
    for (const [key, resp] of Object.entries(setResponse)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS for item ${key} but received ${resp.toString()}`);
    }

    const response = await batchGet(cacheClient, integrationTestCacheName, [
      'a',
      'b',
      'c',
      '1',
      '2',
      '3',
    ]);
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT for key ${key}, received ${resp.toString()}`);
    }
  });

  it('batchGet happy path with some hits and misses', async () => {
    // Set some values first
    const setResponse = await batchSet(
      cacheClient,
      integrationTestCacheName,
      ['a', 'b', 'c', '1', '2', '3'],
      ['apple', 'berry', 'cantaloupe', 'first', 'second', 'third']
    );
    for (const [key, resp] of Object.entries(setResponse)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS for item ${key} but received ${resp.toString()}`);
    }

    const response = await batchGet(cacheClient, integrationTestCacheName, [
      'a',
      'b',
      'c',
      '10',
      '11',
      '12',
    ]);
    for (const [key, resp] of Object.entries(response)) {
      if (['a', 'b', 'c'].includes(key)) {
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheGet.Hit);
        }, `expected HIT for key ${key}, received ${resp.toString()}`);
      } else {
        expectWithMessage(() => {
          expect(resp).toBeInstanceOf(CacheGet.Miss);
        }, `expected MISS for key ${key}, received ${resp.toString()}`);
      }
    }
  });

  it('batchDelete happy path', async () => {
    // Set some values first
    const setResponse = await batchSet(
      cacheClient,
      integrationTestCacheName,
      ['a', 'b', 'c', '1', '2', '3'],
      ['apple', 'berry', 'cantaloupe', 'first', 'second', 'third']
    );
    for (const [key, resp] of Object.entries(setResponse)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS for item ${key} but received ${resp.toString()}`);
    }

    const response = await batchDelete(cacheClient, integrationTestCacheName, [
      'a',
      'b',
      'c',
      '1',
      '2',
      '3',
    ]);
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS for key ${key}, received ${resp.toString()}`);
    }
  });

  it('batchDelete some existing and some non-existing keys', async () => {
    // Set some values first
    const setResponse = await batchSet(
      cacheClient,
      integrationTestCacheName,
      ['a', 'b', 'c', '1', '2', '3'],
      ['apple', 'berry', 'cantaloupe', 'first', 'second', 'third']
    );
    for (const [key, resp] of Object.entries(setResponse)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS for item ${key} but received ${resp.toString()}`);
    }

    const response = await batchDelete(cacheClient, integrationTestCacheName, [
      'ab',
      'cd',
      'ef',
      '1',
      '2',
      '3',
    ]);
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS for key ${key}, received ${resp.toString()}`);
    }
  });
});
