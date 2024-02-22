import {
  CacheGet,
  CacheSet,
  GetBatch,
  ICacheClient,
  SetBatch,
} from '@gomomento/sdk-core';
import {expectWithMessage} from './common-int-test-utils';
import {delay} from './auth-client';

export function runBatchGetSetTests(
  cacheClient: ICacheClient,
  cacheClientWithThrowOnErrors: ICacheClient,
  integrationTestCacheName: string
) {
  describe('#batch get and set', () => {
    it('getBatch happy path with all misses', async () => {
      const keys = ['a', 'b', 'c', '1', '2', '3'];
      const response = await cacheClient.getBatch(
        integrationTestCacheName,
        keys
      );

      // Check get batch response
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(GetBatch.Success);
      }, `expected SUCCESS for keys ${keys.toString()}, received ${response.toString()}`);

      // Check each response in the batch
      const getResults = response.results();
      if (getResults === undefined) {
        fail('expected getResults array to be defined');
      } else {
        expectWithMessage(() => {
          expect(getResults.length).toEqual(keys.length);
        }, `expected non-empty results, received ${getResults.toString()}`);

        for (const [index, resp] of getResults.entries()) {
          expectWithMessage(() => {
            expect(resp).toBeInstanceOf(CacheGet.Miss);
          }, `expected MISS for getting key ${keys[index]}, received ${resp.toString()}`);
        }
      }
    });

    it('setBatch happy path', async () => {
      // Set some values and check set batch response
      const items = new Map<string, string>([
        ['a', 'apple'],
        ['b', 'berry'],
        ['c', 'cantaloupe'],
        ['1', 'first'],
        ['2', 'second'],
        ['3', 'third'],
      ]);
      const response = await cacheClient.setBatch(
        integrationTestCacheName,
        items
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(SetBatch.Success);
      }, `expected SUCCESS, received ${response.toString()}`);

      // Check each response in the set batch
      const setResults = response.results();
      const keys = [...items.keys()];
      if (setResults === undefined) {
        fail('expected setResults array to be defined');
      } else {
        expectWithMessage(() => {
          expect(setResults.length).toEqual(keys.length);
        }, `expected non-empty results, received ${setResults.toString()}`);

        for (const [index, resp] of setResults.entries()) {
          expectWithMessage(() => {
            expect(resp).toBeInstanceOf(CacheSet.Success);
          }, `expected SUCCESS for setting key ${keys[index]} but received ${resp.toString()}`);
        }
      }
    });

    it('setBatch happy path with ttl', async () => {
      // Set some values and check set batch response
      const items = new Map<string, string>([
        ['a', 'apple'],
        ['b', 'berry'],
        ['c', 'cantaloupe'],
        ['1', 'first'],
        ['2', 'second'],
        ['3', 'third'],
      ]);
      const response = await cacheClient.setBatch(
        integrationTestCacheName,
        items,
        {ttl: 3}
      );
      expectWithMessage(() => {
        expect(response).toBeInstanceOf(SetBatch.Success);
      }, `expected SUCCESS, received ${response.toString()}`);

      // Check each response in the set batch
      const setResults = response.results();
      const keys = [...items.keys()];
      if (setResults === undefined) {
        fail('expected setResults array to be defined');
      } else {
        expectWithMessage(() => {
          expect(setResults.length).toEqual(keys.length);
        }, `expected non-empty results, received ${setResults.toString()}`);

        for (const [index, resp] of setResults.entries()) {
          expectWithMessage(() => {
            expect(resp).toBeInstanceOf(CacheSet.Success);
          }, `expected SUCCESS for setting key ${keys[index]} but received ${resp.toString()}`);
        }
      }

      await delay(5000);

      // Fetch values and check get batch response
      const getResponse = await cacheClient.getBatch(
        integrationTestCacheName,
        keys
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(GetBatch.Success);
      }, `expected SUCCESS for keys ${keys.toString()}, received ${getResponse.toString()}`);

      // Check each response in the get batch
      const getResults = getResponse.results();
      if (getResults === undefined) {
        fail('expected getResults array to be defined');
      } else {
        expectWithMessage(() => {
          expect(getResults.length).toEqual(keys.length);
        }, `expected non-empty results, received ${getResults.toString()}`);

        for (const [index, resp] of getResults.entries()) {
          expectWithMessage(() => {
            expect(resp).toBeInstanceOf(CacheGet.Miss);
          }, `expected MISS for getting key ${keys[index]}, received ${resp.toString()}`);
        }
      }
    });

    it('getBatch happy path with all hits', async () => {
      // Set some values and check set batch response
      const items = new Map<string, string>([
        ['a', 'apple'],
        ['b', 'berry'],
        ['c', 'cantaloupe'],
        ['1', 'first'],
        ['2', 'second'],
        ['3', 'third'],
      ]);
      const setResponse = await cacheClient.setBatch(
        integrationTestCacheName,
        items
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(SetBatch.Success);
      }, `expected SUCCESS, received ${setResponse.toString()}`);

      // Check each response in the set batch
      const setResults = setResponse.results();
      const keys = [...items.keys()];
      if (setResults === undefined) {
        fail('expected setResults array to be defined');
      } else {
        expectWithMessage(() => {
          expect(setResults.length).toEqual(keys.length);
        }, `expected non-empty results, received ${setResults.toString()}`);

        for (const [index, resp] of setResults.entries()) {
          expectWithMessage(() => {
            expect(resp).toBeInstanceOf(CacheSet.Success);
          }, `expected SUCCESS for setting key ${keys[index]} but received ${resp.toString()}`);
        }

        // Fetch values and check get batch response
        const getResponse = await cacheClient.getBatch(
          integrationTestCacheName,
          keys
        );
        expectWithMessage(() => {
          expect(getResponse).toBeInstanceOf(GetBatch.Success);
        }, `expected SUCCESS for keys ${keys.toString()}, received ${getResponse.toString()}`);

        // Check each response in the get batch
        const getResults = getResponse.results();
        if (getResults === undefined) {
          fail('expected getResults array to be defined');
        } else {
          expectWithMessage(() => {
            expect(getResults.length).toEqual(keys.length);
          }, `expected non-empty results, received ${getResults.toString()}`);

          for (const [index, resp] of getResults.entries()) {
            const key = keys[index];
            expectWithMessage(() => {
              expect(resp).toBeInstanceOf(CacheGet.Hit);
            }, `expected HIT for getting key ${key}, received ${resp.toString()}`);

            const expectedValue = items.get(key) ?? 'value not in items map';
            const receivedValue =
              resp.value() ?? 'value could not be retrieved from response';
            expectWithMessage(() => {
              expect(receivedValue).toEqual(expectedValue);
            }, `expected key ${key} to be set to ${expectedValue} but received ${receivedValue}`);
          }
        }
      }
    });

    it('getBatch happy path with some hits and misses', async () => {
      // Set some values and check set batch response
      const items = new Map<string, string>([
        ['a', 'alligator'],
        ['b', 'bear'],
        ['c', 'cougar'],
        ['e', 'elephant'],
        ['f', 'flamingo'],
        ['g', 'gorilla'],
      ]);
      const setResponse = await cacheClient.setBatch(
        integrationTestCacheName,
        items
      );
      expectWithMessage(() => {
        expect(setResponse).toBeInstanceOf(SetBatch.Success);
      }, `expected SUCCESS, received ${setResponse.toString()}`);

      // Check each response in the set batch
      const setResults = setResponse.results();
      if (setResults === undefined) {
        fail('expected setResults array to be defined');
      } else {
        const keys = [...items.keys()];
        expectWithMessage(() => {
          expect(setResults.length).toEqual(keys.length);
        }, `expected non-empty results, received ${setResults.toString()}`);

        for (const [index, resp] of setResults.entries()) {
          expectWithMessage(() => {
            expect(resp).toBeInstanceOf(CacheSet.Success);
          }, `expected SUCCESS for key ${keys[index]} but received ${resp.toString()}`);
        }
      }

      // Fetch values and check get batch response
      const keys = ['a', 'b', 'c', '10', '11', '12'];
      const getResponse = await cacheClient.getBatch(
        integrationTestCacheName,
        keys
      );
      expectWithMessage(() => {
        expect(getResponse).toBeInstanceOf(GetBatch.Success);
      }, `expected SUCCESS for keys ${keys.toString()}, received ${getResponse.toString()}`);

      // Check each response in the get batch
      const getResults = getResponse.results();
      if (getResults === undefined) {
        fail('expected getResults array to be defined');
      } else {
        expectWithMessage(() => {
          expect(getResults.length).toEqual(keys.length);
        }, `expected non-empty results, received ${getResults.toString()}`);

        for (const [index, resp] of getResults.entries()) {
          const key = keys[index];

          if (['a', 'b', 'c'].includes(key)) {
            expectWithMessage(() => {
              expect(resp).toBeInstanceOf(CacheGet.Hit);
            }, `expected HIT for key ${key} but received ${resp.toString()}`);

            const expectedValue = items.get(key) ?? 'value not in items map';
            const receivedValue =
              resp.value() ?? 'value could not be retrieved from response';
            expectWithMessage(() => {
              expect(receivedValue).toEqual(expectedValue);
            }, `expected key ${key} to be set to ${expectedValue} but received ${receivedValue}`);
          } else {
            expectWithMessage(() => {
              expect(resp).toBeInstanceOf(CacheGet.Miss);
            }, `expected MISS for key ${key} but received ${resp.toString()}`);
          }
        }
      }
    });
  });
}
