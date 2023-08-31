import {
  VectorAddItemBatch,
  VectorSearch,
  VectorDeleteItemBatch,
  IVectorIndexClient,
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

export function runVectorDataPlaneTest(vectorClient: IVectorIndexClient) {
  describe('addItem validation', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.addItemBatch(props.indexName, []);
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

  describe('delete validation', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.deleteItemBatch(props.indexName, []);
    });
  });

  describe('addItem and search', () => {
    it('should support addItem and search', async () => {
      const indexName = testIndexName();
      await WithIndex(vectorClient, indexName, 2, async () => {
        const addResponse = await vectorClient.addItemBatch(indexName, [
          {
            id: 'test_item',
            vector: [1.0, 2.0],
          },
        ]);
        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(VectorAddItemBatch.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}}`);

        await sleep(2_000);

        const searchResponse = await vectorClient.search(
          indexName,
          [1.0, 2.0],
          {topK: 1}
        );
        expectWithMessage(() => {
          expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
        }, `expected SUCCESS but got ${searchResponse.toString()}}`);
        const successResponse = searchResponse as VectorSearch.Success;
        expect(successResponse.hits()).toEqual([
          {
            id: 'test_item',
            distance: 5.0,
            metadata: {},
          },
        ]);
      });
    });

    it('should support adding multiple items and searching', async () => {
      const indexName = testIndexName();
      await WithIndex(vectorClient, indexName, 2, async () => {
        const addResponse = await vectorClient.addItemBatch(indexName, [
          {id: 'test_item_1', vector: [1.0, 2.0]},
          {id: 'test_item_2', vector: [3.0, 4.0]},
          {id: 'test_item_3', vector: [5.0, 6.0]},
        ]);
        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(VectorAddItemBatch.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}}`);

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
          {id: 'test_item_3', distance: 17.0, metadata: {}},
          {id: 'test_item_2', distance: 11.0, metadata: {}},
          {id: 'test_item_1', distance: 5.0, metadata: {}},
        ]);
      });
    });

    it('should support adding multiple items and searching with top k', async () => {
      const indexName = testIndexName();
      await WithIndex(vectorClient, indexName, 2, async () => {
        const addResponse = await vectorClient.addItemBatch(indexName, [
          {id: 'test_item_1', vector: [1.0, 2.0]},
          {id: 'test_item_2', vector: [3.0, 4.0]},
          {id: 'test_item_3', vector: [5.0, 6.0]},
        ]);
        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(VectorAddItemBatch.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}}`);

        await sleep(2_000);
        const searchResponse = await vectorClient.search(
          indexName,
          [1.0, 2.0],
          {topK: 2}
        );
        expectWithMessage(() => {
          expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
        }, `expected SUCCESS but got ${searchResponse.toString()}}`);
        const successResponse = searchResponse as VectorSearch.Success;
        expect(successResponse.hits()).toEqual([
          {id: 'test_item_3', distance: 17.0, metadata: {}},
          {id: 'test_item_2', distance: 11.0, metadata: {}},
        ]);
      });
    });

    it('should support add and search with metadata', async () => {
      const indexName = testIndexName();
      await WithIndex(vectorClient, indexName, 2, async () => {
        const addResponse = await vectorClient.addItemBatch(indexName, [
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
          expect(addResponse).toBeInstanceOf(VectorAddItemBatch.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}}`);

        await sleep(2_000);

        let searchResponse = await vectorClient.search(indexName, [1.0, 2.0], {
          topK: 3,
        });
        expectWithMessage(() => {
          expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
        }, `expected SUCCESS but got ${searchResponse.toString()}}`);
        let successResponse = searchResponse as VectorSearch.Success;
        expect(successResponse.hits()).toEqual([
          {id: 'test_item_3', distance: 17.0, metadata: {}},
          {id: 'test_item_2', distance: 11.0, metadata: {}},
          {id: 'test_item_1', distance: 5.0, metadata: {}},
        ]);

        searchResponse = await vectorClient.search(indexName, [1.0, 2.0], {
          topK: 3,
          metadataFields: ['key1'],
        });
        expectWithMessage(() => {
          expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
        }, `expected SUCCESS but got ${searchResponse.toString()}}`);
        successResponse = searchResponse as VectorSearch.Success;
        expect(successResponse.hits()).toEqual([
          {id: 'test_item_3', distance: 17.0, metadata: {key1: 'value3'}},
          {id: 'test_item_2', distance: 11.0, metadata: {}},
          {id: 'test_item_1', distance: 5.0, metadata: {key1: 'value1'}},
        ]);

        searchResponse = await vectorClient.search(indexName, [1.0, 2.0], {
          topK: 3,
          metadataFields: ['key1', 'key2', 'key3', 'key4'],
        });
        expectWithMessage(() => {
          expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
        }, `expected SUCCESS but got ${searchResponse.toString()}}`);
        successResponse = searchResponse as VectorSearch.Success;
        expect(successResponse.hits()).toEqual([
          {
            id: 'test_item_3',
            distance: 17.0,
            metadata: {key1: 'value3', key3: 'value3'},
          },
          {id: 'test_item_2', distance: 11.0, metadata: {key2: 'value2'}},
          {id: 'test_item_1', distance: 5.0, metadata: {key1: 'value1'}},
        ]);
      });
    });

    it('should fail when adding item with wrong number of dimensions', async () => {
      const indexName = testIndexName();
      await WithIndex(vectorClient, indexName, 2, async () => {
        const addResponse = await vectorClient.addItemBatch(indexName, [
          {id: 'test_item', vector: [1.0, 2.0, 3.0]},
        ]);
        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(VectorAddItemBatch.Error);
        }, `expected ERROR but got ${addResponse.toString()}}`);

        const expectedInnerExMessage =
          "3 INVALID_ARGUMENT: invalid parameter: vector, vector dimension has to match the index's dimension";
        const errorResponse = addResponse as VectorAddItemBatch.Error;
        expect(errorResponse.message()).toEqual(
          `Invalid argument passed to Momento client: ${expectedInnerExMessage}`
        );
        expect(errorResponse.innerException().message).toEqual(
          expectedInnerExMessage
        );
      });
    });

    it('should fail when searching with wrong number of dimensions', async () => {
      const indexName = testIndexName();
      await WithIndex(vectorClient, indexName, 2, async () => {
        const addResponse = await vectorClient.addItemBatch(indexName, [
          {id: 'test_item_1', vector: [1.0, 2.0]},
          {id: 'test_item_2', vector: [3.0, 4.0]},
          {id: 'test_item_3', vector: [5.0, 6.0]},
        ]);
        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(VectorAddItemBatch.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}}`);

        await sleep(2_000);

        const searchResponse = await vectorClient.search(
          indexName,
          [1.0, 2.0, 3.0],
          {topK: 2}
        );
        expectWithMessage(() => {
          expect(searchResponse).toBeInstanceOf(VectorSearch.Error);
        }, `expected ERROR but got ${searchResponse.toString()}}`);
        const errorResponse = searchResponse as VectorSearch.Error;

        const expectedInnerExMessage =
          '3 INVALID_ARGUMENT: invalid parameter: query_vector, query vector dimension must match the index dimension';
        expect(errorResponse.message()).toEqual(
          `Invalid argument passed to Momento client: ${expectedInnerExMessage}`
        );
        expect(errorResponse.innerException().message).toEqual(
          expectedInnerExMessage
        );
      });
    });
  });

  //
  //   del_response = await vector_index_client_async.delete_index(index_name)
  //   assert isinstance(del_response, DeleteIndex.Success)

  describe('deleteItem', () => {
    it('should delete ids', async () => {
      const indexName = testIndexName();
      await WithIndex(vectorClient, indexName, 2, async () => {
        const addResponse = await vectorClient.addItemBatch(indexName, [
          {id: 'test_item_1', vector: [1.0, 2.0]},
          {id: 'test_item_2', vector: [3.0, 4.0]},
          {id: 'test_item_3', vector: [5.0, 6.0]},
          {id: 'test_item_3', vector: [7.0, 8.0]},
        ]);

        expectWithMessage(() => {
          expect(addResponse).toBeInstanceOf(VectorAddItemBatch.Success);
        }, `expected SUCCESS but got ${addResponse.toString()}}`);

        await sleep(2_000);

        let searchResponse = await vectorClient.search(indexName, [1.0, 2.0], {
          topK: 10,
        });
        expectWithMessage(() => {
          expect(searchResponse).toBeInstanceOf(VectorSearch.Success);
        }, `expected SUCCESS but got ${searchResponse.toString()}}`);
        let successResponse = searchResponse as VectorSearch.Success;
        expect(successResponse.hits()).toEqual([
          {id: 'test_item_3', distance: 23.0, metadata: {}},
          {id: 'test_item_2', distance: 11.0, metadata: {}},
          {id: 'test_item_1', distance: 5.0, metadata: {}},
        ]);

        const deleteResponse = await vectorClient.deleteItemBatch(indexName, [
          'test_item_1',
          'test_item_3',
        ]);

        expectWithMessage(() => {
          expect(deleteResponse).toBeInstanceOf(VectorDeleteItemBatch.Success);
        }, `expected SUCCESS but got ${deleteResponse.toString()}}`);

        await sleep(2_000);

        searchResponse = await vectorClient.search(indexName, [1.0, 2.0], {
          topK: 10,
        });
        successResponse = searchResponse as VectorSearch.Success;
        expect(successResponse.hits()).toEqual([
          {id: 'test_item_2', distance: 11.0, metadata: {}},
        ]);
      });
    });
  });
}