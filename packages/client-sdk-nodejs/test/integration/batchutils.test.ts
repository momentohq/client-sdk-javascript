import {CacheDelete, CacheGet, CacheSet} from '@gomomento/sdk-core';
import {
  batchDelete,
  batchGet,
  batchSet,
} from '../../src/batchutils/batch-functions';
import {
  BatchDeleteRequest,
  BatchGetRequest,
  BatchSetRequest,
} from '../../src/batchutils/batch-props';
import {SetupIntegrationTest} from './integration-setup';
import {expectWithMessage} from '@gomomento/common-integration-tests';

const {cacheClient, integrationTestCacheName} = SetupIntegrationTest();

describe('BatchUtils', () => {
  it('batchGet happy path with all misses', async () => {
    const request: BatchGetRequest = {
      cacheClient: cacheClient,
      cacheName: integrationTestCacheName,
      keys: ['a', 'b', 'c', '1', '2', '3'],
    };
    const response = await batchGet(request);
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheGet.Miss);
      }, `expected MISS for key ${key}, received ${resp.toString()}`);
    }
  });

  it('batchSet happy path', async () => {
    const request: BatchSetRequest = {
      cacheClient: cacheClient,
      cacheName: integrationTestCacheName,
      items: [
        {key: 'a', value: 'apple'},
        {key: 'b', value: 'berry'},
        {key: 'c', value: 'cantaloupe'},
        {key: '1', value: 'first'},
        {key: '2', value: 'second'},
        {key: '3', value: 'third'},
      ],
    };
    const response = await batchSet(request);
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS for item ${key} but received ${resp.toString()}`);
    }
  });

  it('batchGet happy path with all hits', async () => {
    // Set some values first
    const setRequest: BatchSetRequest = {
      cacheClient: cacheClient,
      cacheName: integrationTestCacheName,
      items: [
        {key: 'a', value: 'apple'},
        {key: 'b', value: 'berry'},
        {key: 'c', value: 'cantaloupe'},
        {key: '1', value: 'first'},
        {key: '2', value: 'second'},
        {key: '3', value: 'third'},
      ],
    };
    const setResponse = await batchSet(setRequest);
    for (const [key, resp] of Object.entries(setResponse)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS for item ${key} but received ${resp.toString()}`);
    }

    const request: BatchGetRequest = {
      cacheClient: cacheClient,
      cacheName: integrationTestCacheName,
      keys: ['a', 'b', 'c', '1', '2', '3'],
    };
    const response = await batchGet(request);
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheGet.Hit);
      }, `expected HIT for key ${key}, received ${resp.toString()}`);
    }
  });

  it('batchDelete happy path', async () => {
    // Set some values first
    const setRequest: BatchSetRequest = {
      cacheClient: cacheClient,
      cacheName: integrationTestCacheName,
      items: [
        {key: 'a', value: 'apple'},
        {key: 'b', value: 'berry'},
        {key: 'c', value: 'cantaloupe'},
        {key: '1', value: 'first'},
        {key: '2', value: 'second'},
        {key: '3', value: 'third'},
      ],
    };
    const setResponse = await batchSet(setRequest);
    for (const [key, resp] of Object.entries(setResponse)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheSet.Success);
      }, `expected SUCCESS for item ${key} but received ${resp.toString()}`);
    }

    const request: BatchDeleteRequest = {
      cacheClient: cacheClient,
      cacheName: integrationTestCacheName,
      keys: ['a', 'b', 'c', '1', '2', '3'],
    };
    const response = await batchDelete(request);
    for (const [key, resp] of Object.entries(response)) {
      expectWithMessage(() => {
        expect(resp).toBeInstanceOf(CacheDelete.Success);
      }, `expected SUCCESS for key ${key}, received ${resp.toString()}`);
    }
  });
});
