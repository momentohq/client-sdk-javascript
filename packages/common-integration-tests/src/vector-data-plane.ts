import {
  ALL_VECTOR_METADATA,
  InvalidArgumentError,
  IVectorIndexClient,
  MomentoErrorCode,
  SearchOptions,
  VECTOR_DEFAULT_TOPK,
  VectorCountItems,
  VectorDeleteItemBatch,
  VectorFilterExpression as F,
  VectorGetItemBatch,
  VectorGetItemMetadataBatch,
  VectorIndexItem,
  VectorSearch,
  VectorSearchAndFetchVectors,
  VectorSimilarityMetric,
  VectorUpsertItemBatch,
} from '@gomomento/sdk-core';
import {
  expectWithMessage,
  ItBehavesLikeItValidatesIndexName,
  ItBehavesLikeItValidatesTopK,
  testIndexName,
  ValidateVectorProps,
  WithIndex,
} from './common-int-test-utils';
import {sleep} from '@gomomento/sdk-core/dist/src/internal/utils';

export function runVectorDataPlaneTest(
  vectorClient: IVectorIndexClient,
  vectorClientWithThrowOnErrors: IVectorIndexClient
) {
  describe('countItems validation', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.countItems(props.indexName);
    });
  });

  describe('getItemBatch and getItemMetadataBatch validation', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.getItemBatch(props.indexName, ['']);
    });

    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.getItemMetadataBatch(props.indexName, ['']);
    });
  });

  describe('upsertItem validation', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.upsertItemBatch(props.indexName, []);
    });
  });

  describe('search validation', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.search(props.indexName, []);
    });

    ItBehavesLikeItValidatesTopK((props: ValidateVectorProps) => {
      return vectorClient.search(props.indexName, [], {topK: props.topK});
    });
  });

  describe('search and fetch vectors validation', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.searchAndFetchVectors(props.indexName, []);
    });

    ItBehavesLikeItValidatesTopK((props: ValidateVectorProps) => {
      return vectorClient.searchAndFetchVectors(props.indexName, [], {
        topK: props.topK,
      });
    });
  });

  describe('delete validation', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.deleteItemBatch(props.indexName, []);
    });
  });

  describe('upsertItem and search', () => {
    /*
     * In the following tests we test both search and searchAndFetchVectors with a common
     * suite of tests. To do this we abstract away calling the search method, building the hits
     * (which may or may not contain the vectors), and asserting the results.
     *
     * We have two helpers to do this: search and buildSearchHits. The search method calls the
     * appropriate search method on the vector client. The buildSearchHits method takes the
     * search hits and the search method name and returns the expected search hits.
     */

    async function search(
      vectorClient: IVectorIndexClient,
      searchMethodName: string,
      indexName: string,
      queryVector: number[],
      options?: SearchOptions
    ): Promise<VectorSearch.Response | VectorSearchAndFetchVectors.Response> {
      if (searchMethodName === 'search') {
        return await vectorClient.search(indexName, queryVector, options);
      } else if (searchMethodName === 'searchAndFetchVectors') {
        return await vectorClient.searchAndFetchVectors(
          indexName,
          queryVector,
          options
        );
      } else {
        throw new Error(`unknown search method ${searchMethodName}`);
      }
    }

    function buildSearchHits(
      searchHits: VectorSearch.SearchHit[],
      searchMethodName: string,
      items: VectorIndexItem[]
    ): VectorSearch.SearchHit[] {
      if (searchMethodName === 'search') {
        return searchHits;
      } else if (searchMethodName === 'searchAndFetchVectors') {
        const idToVector = new Map<string, number[]>();
        items.forEach(item => {
          idToVector.set(item.id, item.vector);
        });
        return searchHits.map(hit => {
          return {
            ...hit,
            vector: idToVector.get(hit.id),
          };
        });
      } else {
        throw new Error(`unknown search method ${searchMethodName}`);
      }
    }

    it('should support use a default topk when not supplied', async () => {
      const indexName = testIndexName('data-default-topk');
      await WithIndex(
        vectorClient,
        indexName,
        2,
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          const items = [];
          for (let i = 0; i < 15; i++) {
            items.push({id: `test_item_${i}`, vector: [i, i]});
          }

          const upsertResponse = await vectorClient.upsertItemBatch(
            indexName,
            items
          );
          expectWithMessage(() => {
            expect(upsertResponse).toBeInstanceOf(
              VectorUpsertItemBatch.Success
            );
          }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

          await sleep(2_000);

          const searchResponse = await vectorClient.search(
            indexName,
            [1.0, 2.0]
          );
          expectWithMessage(() => {
            expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
          }, `expected SUCCESS but got ${searchResponse.toString()}}`);
          const successResponse = searchResponse as VectorSearch.Success;
          expect(successResponse.hits().length).toEqual(VECTOR_DEFAULT_TOPK);

          const searchAndFetchVectorsResponse =
            await vectorClient.searchAndFetchVectors(indexName, [1.0, 2.0]);
          expectWithMessage(() => {
            expect(searchAndFetchVectorsResponse).toBeInstanceOf(
              VectorSearchAndFetchVectors.Success
            );
          }, `expected SUCCESS but got ${searchAndFetchVectorsResponse.toString()}}`);
          const successResponse2 =
            searchResponse as VectorSearchAndFetchVectors.Success;
          expect(successResponse2.hits().length).toEqual(VECTOR_DEFAULT_TOPK);
        }
      );
    });

    it.each([
      {searchMethodName: 'search', response: VectorSearch.Success},
      {
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Success,
      },
    ])(
      'should support upsertItem and search using inner product',
      async ({searchMethodName, response}) => {
        const indexName = testIndexName('data-upsert-search-inner-product');
        await WithIndex(
          vectorClient,
          indexName,
          2,
          VectorSimilarityMetric.INNER_PRODUCT,
          async () => {
            const items = [
              {
                id: 'test_item',
                vector: [1.0, 2.0],
              },
            ];
            const upsertResponse = await vectorClient.upsertItemBatch(
              indexName,
              items
            );
            expectWithMessage(() => {
              expect(upsertResponse).toBeInstanceOf(
                VectorUpsertItemBatch.Success
              );
            }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

            await sleep(2_000);

            const searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [1.0, 2.0],
              {topK: 1}
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);
            const hits = buildSearchHits(
              [
                {
                  id: 'test_item',
                  score: 5.0,
                  metadata: {},
                },
              ],
              searchMethodName,
              items
            );
            expect(searchResponse.hits()).toEqual(hits);
          }
        );
      }
    );

    it.each([
      {searchMethodName: 'search', response: VectorSearch.Success},
      {
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Success,
      },
    ])(
      'should support upsertItem and search using cosine similarity',
      async ({searchMethodName, response}) => {
        const indexName = testIndexName('data-upsert-search-cosine-similarity');
        await WithIndex(
          vectorClient,
          indexName,
          2,
          VectorSimilarityMetric.COSINE_SIMILARITY,
          async () => {
            const items = [
              {
                id: 'test_item_1',
                vector: [1.0, 1.0],
              },
              {
                id: 'test_item_2',
                vector: [-1.0, 1.0],
              },
              {
                id: 'test_item_3',
                vector: [-1.0, -1.0],
              },
            ];
            const upsertResponse = await vectorClient.upsertItemBatch(
              indexName,
              items
            );
            expectWithMessage(() => {
              expect(upsertResponse).toBeInstanceOf(
                VectorUpsertItemBatch.Success
              );
            }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

            await sleep(2_000);

            const searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [2.0, 2.0],
              {topK: 3}
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);
            const hits = buildSearchHits(
              [
                {
                  id: 'test_item_1',
                  score: 1.0,
                  metadata: {},
                },
                {
                  id: 'test_item_2',
                  score: 0.0,
                  metadata: {},
                },
                {
                  id: 'test_item_3',
                  score: -1.0,
                  metadata: {},
                },
              ],
              searchMethodName,
              items
            );
            expect(searchResponse.hits()).toEqual(hits);
          }
        );
      }
    );

    it.each([
      {searchMethodName: 'search', response: VectorSearch.Success},
      {
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Success,
      },
    ])(
      'should support upsertItem and search using euclidean similarity',
      async ({searchMethodName, response}) => {
        const indexName = testIndexName(
          'data-upsert-search-euclidean-similarity'
        );
        await WithIndex(
          vectorClient,
          indexName,
          2,
          VectorSimilarityMetric.EUCLIDEAN_SIMILARITY,
          async () => {
            const items = [
              {
                id: 'test_item_1',
                vector: [1.0, 1.0],
              },
              {
                id: 'test_item_2',
                vector: [-1.0, 1.0],
              },
              {
                id: 'test_item_3',
                vector: [-1.0, -1.0],
              },
            ];
            const upsertResponse = await vectorClient.upsertItemBatch(
              indexName,
              items
            );
            expectWithMessage(() => {
              expect(upsertResponse).toBeInstanceOf(
                VectorUpsertItemBatch.Success
              );
            }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

            await sleep(2_000);

            const searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [1.0, 1.0],
              {topK: 3}
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);
            const hits = buildSearchHits(
              [
                {
                  id: 'test_item_1',
                  score: 0.0,
                  metadata: {},
                },
                {
                  id: 'test_item_2',
                  score: 4.0,
                  metadata: {},
                },
                {
                  id: 'test_item_3',
                  score: 8.0,
                  metadata: {},
                },
              ],
              searchMethodName,
              items
            );
            expect(searchResponse.hits()).toEqual(hits);
          }
        );
      }
    );

    it('should support upserting multiple items and searching', async () => {
      const indexName = testIndexName('data-upsert-search-multiple-items');
      await WithIndex(
        vectorClient,
        indexName,
        2,
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          const upsertResponse = await vectorClient.upsertItemBatch(indexName, [
            {id: 'test_item_1', vector: [1.0, 2.0]},
            {id: 'test_item_2', vector: [3.0, 4.0]},
            {id: 'test_item_3', vector: [5.0, 6.0]},
          ]);
          expectWithMessage(() => {
            expect(upsertResponse).toBeInstanceOf(
              VectorUpsertItemBatch.Success
            );
          }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

          await sleep(2_000);
          const searchResponse = await vectorClient.search(
            indexName,
            [1.0, 2.0],
            {topK: 3}
          );
          expectWithMessage(() => {
            expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
          }, `expected SUCCESS but got ${searchResponse.toString()}}`);
          const successResponse = searchResponse as VectorSearch.Success;
          expect(successResponse.hits()).toEqual([
            {id: 'test_item_3', score: 17.0, metadata: {}},
            {id: 'test_item_2', score: 11.0, metadata: {}},
            {id: 'test_item_1', score: 5.0, metadata: {}},
          ]);
        }
      );
    });

    it.each([
      {searchMethodName: 'search', response: VectorSearch.Success},
      {
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Success,
      },
    ])(
      'should support upserting multiple items and searching with top k',
      async ({searchMethodName, response}) => {
        const indexName = testIndexName('data-upsert-search-top-k');
        await WithIndex(
          vectorClient,
          indexName,
          2,
          VectorSimilarityMetric.INNER_PRODUCT,
          async () => {
            const items = [
              {id: 'test_item_1', vector: [1.0, 2.0]},
              {id: 'test_item_2', vector: [3.0, 4.0]},
              {id: 'test_item_3', vector: [5.0, 6.0]},
            ];
            const upsertResponse = await vectorClient.upsertItemBatch(
              indexName,
              items
            );
            expectWithMessage(() => {
              expect(upsertResponse).toBeInstanceOf(
                VectorUpsertItemBatch.Success
              );
            }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

            await sleep(2_000);
            const searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [1.0, 2.0],
              {topK: 2}
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);
            const hits = buildSearchHits(
              [
                {id: 'test_item_3', score: 17.0, metadata: {}},
                {id: 'test_item_2', score: 11.0, metadata: {}},
              ],
              searchMethodName,
              items
            );
            expect(searchResponse.hits()).toEqual(hits);
          }
        );
      }
    );

    it.each([
      {searchMethodName: 'search', response: VectorSearch.Success},
      {
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Success,
      },
    ])(
      'should support upsert and search with metadata',
      async ({searchMethodName, response}) => {
        const indexName = testIndexName('data-upsert-search-metadata');
        await WithIndex(
          vectorClient,
          indexName,
          2,
          VectorSimilarityMetric.INNER_PRODUCT,
          async () => {
            const items: VectorIndexItem[] = [
              {
                id: 'test_item_1',
                vector: [1.0, 2.0],
                metadata: {key1: 'value1'},
              },
              {
                id: 'test_item_2',
                vector: [3.0, 4.0],
                metadata: {key2: 'value2'},
              },
              {
                id: 'test_item_3',
                vector: [5.0, 6.0],
                metadata: {key1: 'value3', key3: 'value3'},
              },
            ];
            const upsertResponse = await vectorClient.upsertItemBatch(
              indexName,
              items
            );
            expectWithMessage(() => {
              expect(upsertResponse).toBeInstanceOf(
                VectorUpsertItemBatch.Success
              );
            }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

            await sleep(2_000);

            let searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [1.0, 2.0],
              {
                topK: 3,
              }
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);
            const hits1 = buildSearchHits(
              [
                {id: 'test_item_3', score: 17.0, metadata: {}},
                {id: 'test_item_2', score: 11.0, metadata: {}},
                {id: 'test_item_1', score: 5.0, metadata: {}},
              ],
              searchMethodName,
              items
            );
            expect(searchResponse.hits()).toEqual(hits1);

            searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [1.0, 2.0],
              {
                topK: 3,
                metadataFields: ['key1'],
              }
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);
            const hits2 = buildSearchHits(
              [
                {id: 'test_item_3', score: 17.0, metadata: {key1: 'value3'}},
                {id: 'test_item_2', score: 11.0, metadata: {}},
                {id: 'test_item_1', score: 5.0, metadata: {key1: 'value1'}},
              ],
              searchMethodName,
              items
            );
            expect(searchResponse.hits()).toEqual(hits2);

            searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [1.0, 2.0],
              {
                topK: 3,
                metadataFields: ['key1', 'key2', 'key3', 'key4'],
              }
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);
            const hits3 = buildSearchHits(
              [
                {
                  id: 'test_item_3',
                  score: 17.0,
                  metadata: {key1: 'value3', key3: 'value3'},
                },
                {id: 'test_item_2', score: 11.0, metadata: {key2: 'value2'}},
                {id: 'test_item_1', score: 5.0, metadata: {key1: 'value1'}},
              ],
              searchMethodName,
              items
            );
            expect(searchResponse.hits()).toEqual(hits3);

            searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [1.0, 2.0],
              {
                topK: 3,
                metadataFields: ALL_VECTOR_METADATA,
              }
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);
            const hits4 = buildSearchHits(
              [
                {
                  id: 'test_item_3',
                  score: 17.0,
                  metadata: {key1: 'value3', key3: 'value3'},
                },
                {id: 'test_item_2', score: 11.0, metadata: {key2: 'value2'}},
                {id: 'test_item_1', score: 5.0, metadata: {key1: 'value1'}},
              ],
              searchMethodName,
              items
            );
            expect(searchResponse.hits()).toEqual(hits4);
          }
        );
      }
    );

    it.each([
      {searchMethodName: 'search', response: VectorSearch.Success},
      {
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Success,
      },
    ])(
      'should support upsert and search with diverse metadata',
      async ({searchMethodName, response}) => {
        const indexName = testIndexName('data-upsert-search-diverse-metadata');
        await WithIndex(
          vectorClient,
          indexName,
          2,
          VectorSimilarityMetric.INNER_PRODUCT,
          async () => {
            const metadata = {
              string_key: 'string_value',
              integer_key: 123,
              double_key: 3.14,
              boolean_key: true,
              list_of_strings: ['a', 'b', 'c'],
              empty_list: [],
            };
            const items = [
              {
                id: 'test_item_1',
                vector: [1.0, 2.0],
                metadata,
              },
            ];
            const upsertResponse = await vectorClient.upsertItemBatch(
              indexName,
              items
            );
            expectWithMessage(() => {
              expect(upsertResponse).toBeInstanceOf(
                VectorUpsertItemBatch.Success
              );
            }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

            await sleep(2_000);

            const searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [1.0, 2.0],
              {
                topK: 1,
                metadataFields: ALL_VECTOR_METADATA,
              }
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);
            const hits = buildSearchHits(
              [{id: 'test_item_1', score: 5.0, metadata}],
              searchMethodName,
              items
            );
            expect(searchResponse.hits()).toEqual(hits);
          }
        );
      }
    );

    it.each([
      {
        similarityMetric: VectorSimilarityMetric.COSINE_SIMILARITY,
        scores: [1.0, 0.0, -1.0],
        thresholds: [0.5, -1.01, 1.0],
        searchMethodName: 'search',
        response: VectorSearch.Success,
      },
      {
        similarityMetric: VectorSimilarityMetric.COSINE_SIMILARITY,
        scores: [1.0, 0.0, -1.0],
        thresholds: [0.5, -1.01, 1.0],
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Success,
      },
      {
        similarityMetric: VectorSimilarityMetric.INNER_PRODUCT,
        scores: [4.0, 0.0, -4.0],
        thresholds: [0.0, -4.01, 4.0],
        searchMethodName: 'search',
        response: VectorSearch.Success,
      },
      {
        similarityMetric: VectorSimilarityMetric.INNER_PRODUCT,
        scores: [4.0, 0.0, -4.0],
        thresholds: [0.0, -4.01, 4.0],
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Success,
      },
      {
        similarityMetric: VectorSimilarityMetric.EUCLIDEAN_SIMILARITY,
        scores: [2, 10, 18],
        thresholds: [3, 20, -0.01],
        searchMethodName: 'search',
        response: VectorSearch.Success,
      },
      {
        similarityMetric: VectorSimilarityMetric.EUCLIDEAN_SIMILARITY,
        scores: [2, 10, 18],
        thresholds: [3, 20, -0.01],
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Success,
      },
    ])(
      'should prune results with a search threshold',
      async ({
        similarityMetric,
        scores,
        thresholds,
        searchMethodName,
        response,
      }) => {
        const indexName = testIndexName('data-upsert-search-threshold');
        await WithIndex(
          vectorClient,
          indexName,
          2,
          similarityMetric,
          async () => {
            const items = [
              {
                id: 'test_item_1',
                vector: [1.0, 1.0],
              },
              {
                id: 'test_item_2',
                vector: [-1.0, 1.0],
              },
              {
                id: 'test_item_3',
                vector: [-1.0, -1.0],
              },
            ];
            const upsertResponse = await vectorClient.upsertItemBatch(
              indexName,
              items
            );
            expectWithMessage(() => {
              expect(upsertResponse).toBeInstanceOf(
                VectorUpsertItemBatch.Success
              );
            }, `expected SUCCESS but got ${upsertResponse.toString()}}`);
            await sleep(2_000);

            const queryVector = [2.0, 2.0];
            const searchHits = buildSearchHits(
              [
                {id: 'test_item_1', score: scores[0], metadata: {}},
                {id: 'test_item_2', score: scores[1], metadata: {}},
                {id: 'test_item_3', score: scores[2], metadata: {}},
              ],
              searchMethodName,
              items
            );

            // Test threshold to get only the top result
            const searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              queryVector,
              {topK: 3, scoreThreshold: thresholds[0]}
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse.toString()}}`);

            //
            expectWithMessage(() => {
              expect(searchResponse.hits()).toEqual([searchHits[0]]);
            }, `expected ${JSON.stringify(searchHits[0])} but got ${JSON.stringify(searchResponse.hits())}`);

            // Test threshold to get all results
            const searchResponse2 = await search(
              vectorClient,
              searchMethodName,
              indexName,
              queryVector,
              {topK: 3, scoreThreshold: thresholds[1]}
            );
            expectWithMessage(() => {
              expect(searchResponse2).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse2.toString()}}`);

            expect(searchResponse2.hits()).toEqual(searchHits);

            // Test threshold to get no results
            const searchResponse3 = await search(
              vectorClient,
              searchMethodName,
              indexName,
              queryVector,
              {
                topK: 3,
                scoreThreshold: thresholds[2],
              }
            );
            expectWithMessage(() => {
              expect(searchResponse3).toBeInstanceOf(response);
            }, `expected SUCCESS but got ${searchResponse3.toString()}}`);

            expect(searchResponse3.hits()).toEqual([]);
          }
        );
      }
    );

    it('should replacing existing items with upsert', async () => {
      const indexName = testIndexName('data-upsert-replace-existing');
      await WithIndex(
        vectorClient,
        indexName,
        2,
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          let upsertResponse = await vectorClient.upsertItemBatch(indexName, [
            {
              id: 'test_item_1',
              vector: [1.0, 2.0],
              metadata: {key1: 'value1'},
            },
            {
              id: 'test_item_2',
              vector: [3.0, 4.0],
              metadata: {key2: 'value2'},
            },
            {
              id: 'test_item_3',
              vector: [5.0, 6.0],
              metadata: {key1: 'value3', key3: 'value3'},
            },
          ]);
          expectWithMessage(() => {
            expect(upsertResponse).toBeInstanceOf(
              VectorUpsertItemBatch.Success
            );
          }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

          upsertResponse = await vectorClient.upsertItemBatch(indexName, [
            {
              id: 'test_item_1',
              vector: [2.0, 4.0],
              metadata: {key4: 'value4'},
            },
          ]);
          expectWithMessage(() => {
            expect(upsertResponse).toBeInstanceOf(
              VectorUpsertItemBatch.Success
            );
          }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

          await sleep(2_000);

          const searchResponse = await vectorClient.search(
            indexName,
            [1.0, 2.0],
            {
              topK: 5,
              metadataFields: ALL_VECTOR_METADATA,
            }
          );
          expectWithMessage(() => {
            expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
          }, `expected SUCCESS but got ${searchResponse.toString()}}`);
          const successResponse = searchResponse as VectorSearch.Success;
          expect(successResponse.hits()).toEqual([
            {
              id: 'test_item_3',
              score: 17.0,
              metadata: {key1: 'value3', key3: 'value3'},
            },
            {id: 'test_item_2', score: 11.0, metadata: {key2: 'value2'}},
            {id: 'test_item_1', score: 10.0, metadata: {key4: 'value4'}},
          ]);
        }
      );
    });

    it('should fail when upserting item with wrong number of dimensions', async () => {
      const indexName = testIndexName('data-upsert-wrong-dimensions');
      await WithIndex(
        vectorClient,
        indexName,
        2,
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          const upsertResponse = await vectorClient.upsertItemBatch(indexName, [
            {id: 'test_item', vector: [1.0, 2.0, 3.0]},
          ]);
          expectWithMessage(() => {
            expect(upsertResponse).toBeInstanceOf(VectorUpsertItemBatch.Error);
          }, `expected ERROR but got ${upsertResponse.toString()}}`);

          const expectedInnerExMessage =
            "invalid parameter: vector, vector dimension has to match the index's dimension";
          const errorResponse = upsertResponse as VectorUpsertItemBatch.Error;
          expect(errorResponse.message()).toMatch(
            'Invalid argument passed to Momento client:'
          );
          expect(errorResponse.message()).toMatch(expectedInnerExMessage);
          expect(errorResponse.innerException().message).toMatch(
            expectedInnerExMessage
          );
        }
      );
    });

    it.each([
      {searchMethodName: 'search', response: VectorSearch.Error},
      {
        searchMethodName: 'searchAndFetchVectors',
        response: VectorSearchAndFetchVectors.Error,
      },
    ])(
      'should fail when searching with wrong number of dimensions',
      async ({searchMethodName, response}) => {
        const indexName = testIndexName('data-search-wrong-dimensions');
        await WithIndex(
          vectorClient,
          indexName,
          2,
          VectorSimilarityMetric.INNER_PRODUCT,
          async () => {
            const items = [
              {id: 'test_item_1', vector: [1.0, 2.0]},
              {id: 'test_item_2', vector: [3.0, 4.0]},
              {id: 'test_item_3', vector: [5.0, 6.0]},
            ];
            const upsertResponse = await vectorClient.upsertItemBatch(
              indexName,
              items
            );
            expectWithMessage(() => {
              expect(upsertResponse).toBeInstanceOf(
                VectorUpsertItemBatch.Success
              );
            }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

            await sleep(2_000);

            const searchResponse = await search(
              vectorClient,
              searchMethodName,
              indexName,
              [1.0, 2.0, 3.0],
              {topK: 2}
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(response);
            }, `expected ERROR but got ${searchResponse.toString()}}`);

            const error = searchResponse as VectorSearch.Error;
            const expectedInnerExMessage =
              'invalid parameter: query_vector, query vector dimension must match the index dimension';
            expect(error.message()).toMatch(
              'Invalid argument passed to Momento client'
            );
            expect(error.message()).toMatch(expectedInnerExMessage);
            expect(error.innerException().message).toMatch(
              expectedInnerExMessage
            );
          }
        );
      }
    );
  });

  describe('search filters', () => {
    it('should support search with filter expression', async () => {
      const indexName = testIndexName('data-search-filter-expression');
      await WithIndex(
        vectorClient,
        indexName,
        2,
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          const items = [
            {
              id: 'test_item_1',
              vector: [1.0, 1.0],
              metadata: {
                str: 'value1',
                int: 0,
                float: 0.0,
                bool: true,
                tags: ['a', 'b', 'c'],
              },
            },
            {
              id: 'test_item_2',
              vector: [-1.0, 1.0],
              metadata: {
                str: 'value2',
                int: 5,
                float: 5.0,
                bool: false,
                tags: ['a', 'b'],
              },
            },
            {
              id: 'test_item_3',
              vector: [-1.0, -1.0],
              metadata: {
                str: 'value3',
                int: 10,
                float: 10.0,
                bool: true,
                tags: ['a', 'd'],
              },
            },
          ];
          const upsertResponse = await vectorClient.upsertItemBatch(
            indexName,
            items
          );
          expectWithMessage(() => {
            expect(upsertResponse).toBeInstanceOf(
              VectorUpsertItemBatch.Success
            );
          }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

          await sleep(2_000);

          for (const {filterExpression, expectedIds, testCaseName} of [
            {
              filterExpression: F.equals('str', 'value1'),
              expectedIds: ['test_item_1'],
              testCaseName: 'string equality',
            },
            {
              filterExpression: F.not(F.equals('str', 'value1')),
              expectedIds: ['test_item_2', 'test_item_3'],
              testCaseName: 'string inequality',
            },
            {
              filterExpression: F.equals('int', 0),
              expectedIds: ['test_item_1'],
              testCaseName: 'int equality',
            },
            {
              filterExpression: F.equals('float', 0.0),
              expectedIds: ['test_item_1'],
              testCaseName: 'float equality',
            },
            {
              filterExpression: F.equals('bool', true),
              expectedIds: ['test_item_1', 'test_item_3'],
              testCaseName: 'bool equality',
            },
            {
              filterExpression: F.not(F.equals('bool', true)),
              expectedIds: ['test_item_2'],
              testCaseName: 'bool inequality',
            },
          ]) {
            const searchResponse = await vectorClient.search(
              indexName,
              [2.0, 2.0],
              {filterExpression}
            );
            expectWithMessage(() => {
              expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
            }, `expected search ${testCaseName} SUCCESS but got ${searchResponse.toString()}}`);
            const searchSuccess = searchResponse as VectorSearch.Success;
            expect(searchSuccess.hits().map(hit => hit.id)).toEqual(
              expectedIds
            );

            const searchAndFetchVectorsResponse =
              await vectorClient.searchAndFetchVectors(indexName, [2.0, 2.0], {
                filterExpression,
              });
            expectWithMessage(() => {
              expect(searchAndFetchVectorsResponse).toBeInstanceOf(
                VectorSearchAndFetchVectors.Success
              );
            }, `expected searchAndFetchVectors ${testCaseName} SUCCESS but got ${searchAndFetchVectorsResponse.toString()}}`);
            const searchAndFetchVectorsSuccess =
              searchAndFetchVectorsResponse as VectorSearchAndFetchVectors.Success;
            expect(
              searchAndFetchVectorsSuccess.hits().map(hit => hit.id)
            ).toEqual(expectedIds);
          }
        }
      );
    });
  });

  describe('deleteItem', () => {
    it('should delete ids', async () => {
      const indexName = testIndexName('data-delete-ids');
      await WithIndex(
        vectorClient,
        indexName,
        2,
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          const upsertResponse = await vectorClient.upsertItemBatch(indexName, [
            {id: 'test_item_1', vector: [1.0, 2.0]},
            {id: 'test_item_2', vector: [3.0, 4.0]},
            {id: 'test_item_3', vector: [5.0, 6.0]},
            {id: 'test_item_3', vector: [7.0, 8.0]},
          ]);

          expectWithMessage(() => {
            expect(upsertResponse).toBeInstanceOf(
              VectorUpsertItemBatch.Success
            );
          }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

          await sleep(2_000);

          let searchResponse = await vectorClient.search(
            indexName,
            [1.0, 2.0],
            {
              topK: 10,
            }
          );
          expectWithMessage(() => {
            expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
          }, `expected SUCCESS but got ${searchResponse.toString()}}`);
          let successResponse = searchResponse as VectorSearch.Success;
          expect(successResponse.hits()).toEqual([
            {id: 'test_item_3', score: 23.0, metadata: {}},
            {id: 'test_item_2', score: 11.0, metadata: {}},
            {id: 'test_item_1', score: 5.0, metadata: {}},
          ]);

          const deleteResponse = await vectorClient.deleteItemBatch(indexName, [
            'test_item_1',
            'test_item_3',
          ]);

          expectWithMessage(() => {
            expect(deleteResponse).toBeInstanceOf(
              VectorDeleteItemBatch.Success
            );
          }, `expected SUCCESS but got ${deleteResponse.toString()}}`);

          await sleep(2_000);

          searchResponse = await vectorClient.search(indexName, [1.0, 2.0], {
            topK: 10,
          });
          successResponse = searchResponse as VectorSearch.Success;
          expect(successResponse.hits()).toEqual([
            {id: 'test_item_2', score: 11.0, metadata: {}},
          ]);
        }
      );
    });
  });

  describe('getItemBatch and getItemMetadataBatch', () => {
    /*
     * In the following tests we test both search and searchAndFetchVectors with a common
     * suite of tests. To do this we abstract away calling the search method, building the hits
     * (which may or may not contain the vectors), and asserting the results.
     *
     * We have two helpers to do this: search and buildSearchHits. The search method calls the
     * appropriate search method on the vector client. The buildSearchHits method takes the
     * search hits and the search method name and returns the expected search hits.
     */

    async function get(
      vectorClient: IVectorIndexClient,
      getMethodName: string,
      indexName: string,
      ids: string[]
    ): Promise<
      VectorGetItemBatch.Response | VectorGetItemMetadataBatch.Response
    > {
      if (getMethodName === 'getItemBatch') {
        return await vectorClient.getItemBatch(indexName, ids);
      } else if (getMethodName === 'getItemMetadataBatch') {
        return await vectorClient.getItemMetadataBatch(indexName, ids);
      } else {
        throw new Error(`unknown search method ${getMethodName}`);
      }
    }

    it.each([
      {
        getMethodName: 'getItemBatch',
        ids: [],
        expectedResponse: VectorGetItemBatch.Success,
        values: {},
      },
      {
        getMethodName: 'getItemMetadataBatch',
        ids: [],
        expectedResponse: VectorGetItemMetadataBatch.Success,
        values: {},
      },
      {
        getMethodName: 'getItemBatch',
        ids: ['test_item_1'],
        expectedResponse: VectorGetItemBatch.Success,
        values: {
          test_item_1: {
            id: 'test_item_1',
            vector: [1.0, 2.0],
            metadata: {key1: 'value1'},
          },
        },
      },
      {
        getMethodName: 'getItemMetadataBatch',
        ids: ['test_item_1'],
        expectedResponse: VectorGetItemMetadataBatch.Success,
        values: {
          test_item_1: {
            key1: 'value1',
          },
        },
      },
      {
        getMethodName: 'getItemBatch',
        ids: ['missing_id'],
        expectedResponse: VectorGetItemBatch.Success,
        values: {},
      },
      {
        getMethodName: 'getItemMetadataBatch',
        ids: ['missing_id'],
        expectedResponse: VectorGetItemMetadataBatch.Success,
        values: {},
      },
      {
        getMethodName: 'getItemBatch',
        ids: ['test_item_1', 'missing_id_2', 'test_item_2'],
        expectedResponse: VectorGetItemBatch.Success,
        values: {
          test_item_1: {
            id: 'test_item_1',
            vector: [1.0, 2.0],
            metadata: {key1: 'value1'},
          },
          test_item_2: {
            id: 'test_item_2',
            vector: [3.0, 4.0],
            metadata: {},
          },
        },
      },
      {
        getMethodName: 'getItemMetadataBatch',
        ids: ['test_item_1', 'missing_id_2', 'test_item_2'],
        expectedResponse: VectorGetItemMetadataBatch.Success,
        values: {
          test_item_1: {
            key1: 'value1',
          },
          test_item_2: {},
        },
      },
    ])(
      'should get items and get item metadata',
      async ({getMethodName, ids, expectedResponse, values}) => {
        const indexName = testIndexName('data-get-items');
        await WithIndex(
          vectorClient,
          indexName,
          2,
          VectorSimilarityMetric.INNER_PRODUCT,
          async () => {
            const upsertResponse = await vectorClient.upsertItemBatch(
              indexName,
              [
                {
                  id: 'test_item_1',
                  vector: [1.0, 2.0],
                  metadata: {key1: 'value1'},
                },
                {id: 'test_item_2', vector: [3.0, 4.0]},
                {id: 'test_item_3', vector: [5.0, 6.0]},
              ]
            );
            expectWithMessage(() => {
              expect(upsertResponse).toBeInstanceOf(
                VectorUpsertItemBatch.Success
              );
            }, `expected SUCCESS but got ${upsertResponse.toString()}}`);

            await sleep(2_000);

            const getResponse = await get(
              vectorClient,
              getMethodName,
              indexName,
              ids
            );
            expectWithMessage(() => {
              expect(getResponse).toBeInstanceOf(expectedResponse);
            }, `expected SUCCESS but got ${getResponse.toString()}}`);

            expect(getResponse.values()).toEqual(values);
          }
        );
      }
    );
  });

  describe('when ThrowOnErrors is set to true', () => {
    it('should throw when upserting item with wrong number of dimensions', async () => {
      const indexName = testIndexName(
        'throw-on-errors-data-upsert-wrong-dimensions'
      );
      await WithIndex(
        vectorClient,
        indexName,
        2,
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          await expect(
            async () =>
              await vectorClientWithThrowOnErrors.upsertItemBatch(indexName, [
                {id: 'test_item', vector: [1.0, 2.0, 3.0]},
              ])
          ).rejects.toThrow(InvalidArgumentError);
        }
      );
    });
  });

  describe('countItems', () => {
    it('should return a not found error when the index does not exist', async () => {
      const indexName = testIndexName('data-count-items-not-found');
      const response = await vectorClient.countItems(indexName);
      expect(response).toBeInstanceOf(VectorCountItems.Error);

      const errorResponse = response as VectorCountItems.Error;
      expect(errorResponse.errorCode()).toEqual(
        MomentoErrorCode.NOT_FOUND_ERROR
      );
    });

    it('should return an item count of zero for an empty index', async () => {
      const indexName = testIndexName('data-count-items-empty-index');
      await WithIndex(
        vectorClient,
        indexName,
        2,
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          const response = await vectorClient.countItems(indexName);
          expect(response).toBeInstanceOf(VectorCountItems.Success);
          expect((response as VectorCountItems.Success).itemCount()).toEqual(0);
        }
      );
    });

    it('should count the correct number of items in an index', async () => {
      const indexName = testIndexName('data-count-items');
      const itemCount = 10;
      await WithIndex(
        vectorClient,
        indexName,
        2,
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          const items: VectorIndexItem[] = [];
          for (let i = 0; i < itemCount; i++) {
            items.push({
              id: `test_item_${i}`,
              vector: [i, i],
            });
          }

          const upsertResponse = await vectorClient.upsertItemBatch(
            indexName,
            items
          );
          expect(upsertResponse).toBeInstanceOf(VectorUpsertItemBatch.Success);

          await sleep(2_000);

          const countResponse = await vectorClient.countItems(indexName);
          expect(countResponse).toBeInstanceOf(VectorCountItems.Success);
          expect(
            (countResponse as VectorCountItems.Success).itemCount()
          ).toEqual(itemCount);

          const itemsToDelete: string[] = [];
          const numItemsToDelete = 5;
          for (let i = 0; i < numItemsToDelete; i++) {
            itemsToDelete.push(`test_item_${i}`);
          }

          const deleteResponse = await vectorClient.deleteItemBatch(
            indexName,
            itemsToDelete
          );
          expect(deleteResponse).toBeInstanceOf(VectorDeleteItemBatch.Success);

          await sleep(2_000);

          const countResponse2 = await vectorClient.countItems(indexName);
          expect(countResponse2).toBeInstanceOf(VectorCountItems.Success);
          expect(
            (countResponse2 as VectorCountItems.Success).itemCount()
          ).toEqual(itemCount - numItemsToDelete);
        }
      );
    });
  });
}
