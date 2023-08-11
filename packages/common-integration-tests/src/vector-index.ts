import {
  ValidateVectorProps,
  ItBehavesLikeItValidatesIndexName,
  ItBehavesLikeItValidatesNumDimensions,
  testIndexName,
  expectWithMessage,
  WithIndex,
} from './common-int-test-utils';
import {IVectorClient} from '@gomomento/sdk-core/dist/src/clients/IVectorClient';
import {
  CreateCache,
  DeleteIndex,
  ListCaches,
  ListIndexes,
  MomentoErrorCode,
} from '@gomomento/sdk-core';

export function runVectorIndexTest(Momento: IVectorClient) {
  describe('create/delete vector index', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return Momento.createIndex(props.indexName, props.numDimensions);
    });
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return Momento.deleteIndex(props.indexName);
    });

    ItBehavesLikeItValidatesNumDimensions((props: ValidateVectorProps) => {
      return Momento.createIndex(props.indexName, props.numDimensions);
    });

    // TODO: enable tests below when backend is ready
    it.skip('should return a NotFoundError if deleting a non-existent index', async () => {
      const indexName = testIndexName();
      const deleteResponse = await Momento.deleteIndex(indexName);
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(DeleteIndex.Error);
      }, `expected ERROR but got ${deleteResponse.toString()}`);
      if (deleteResponse instanceof DeleteIndex.Error) {
        expect(deleteResponse.errorCode()).toEqual(
          MomentoErrorCode.NOT_FOUND_ERROR
        );
      }
    });

    it.skip('should return AlreadyExists response if trying to create a index that already exists', async () => {
      const indexName = testIndexName();
      await WithIndex(Momento, indexName, async () => {
        const createResponse = await Momento.createIndex(indexName, 1);
        expect(createResponse).toBeInstanceOf(CreateCache.AlreadyExists);
      });
    });

    it.skip('should create and list an index', async () => {
      const indexName = testIndexName();
      await WithIndex(Momento, indexName, async () => {
        const listResponse = await Momento.listIndexes();
        expectWithMessage(() => {
          expect(listResponse).toBeInstanceOf(ListCaches.Success);
        }, `expected SUCCESS but got ${listResponse.toString()}`);
        if (listResponse instanceof ListIndexes.Success) {
          const caches = listResponse.getIndexes();
          expect(caches.includes(indexName)).toBeTruthy();
        }
      });
    });
  });
}
