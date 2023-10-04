import {
  expectWithMessage,
  ItBehavesLikeItValidatesIndexName,
  ItBehavesLikeItValidatesNumDimensions,
  testIndexName,
  ValidateVectorProps,
  WithIndex,
} from './common-int-test-utils';
import {
  CreateVectorIndex,
  DeleteVectorIndex,
  IVectorIndexClient,
  ListVectorIndexes,
  MomentoErrorCode,
} from '@gomomento/sdk-core';
import {SimilarityMetric} from '@gomomento/sdk-core/dist/src/internal/clients';

export function runVectorControlPlaneTest(vectorClient: IVectorIndexClient) {
  describe('create/delete vector index', () => {
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.createIndex(props.indexName, props.numDimensions);
    });
    ItBehavesLikeItValidatesIndexName((props: ValidateVectorProps) => {
      return vectorClient.deleteIndex(props.indexName);
    });

    ItBehavesLikeItValidatesNumDimensions((props: ValidateVectorProps) => {
      return vectorClient.createIndex(props.indexName, props.numDimensions);
    });

    it('should return an InvalidArgumentError if given a bad similarity metric', async () => {
      const indexName = testIndexName();
      const deleteResponse = await vectorClient.deleteIndex(indexName);
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(DeleteVectorIndex.Error);
      }, `expected ERROR but got ${deleteResponse.toString()}`);
      if (deleteResponse instanceof DeleteVectorIndex.Error) {
        expect(deleteResponse.errorCode()).toEqual(
          MomentoErrorCode.NOT_FOUND_ERROR
        );
      }
    });

    it('should return a NotFoundError if deleting a non-existent index', async () => {
      const indexName = testIndexName();
      const deleteResponse = await vectorClient.deleteIndex(indexName);
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(DeleteVectorIndex.Error);
      }, `expected ERROR but got ${deleteResponse.toString()}`);
      if (deleteResponse instanceof DeleteVectorIndex.Error) {
        expect(deleteResponse.errorCode()).toEqual(
          MomentoErrorCode.NOT_FOUND_ERROR
        );
      }
    });

    it('should return AlreadyExists response if trying to create a index that already exists', async () => {
      const indexName = testIndexName();
      await WithIndex(
        vectorClient,
        indexName,
        10,
        SimilarityMetric.INNER_PRODUCT,
        async () => {
          const createResponse = await vectorClient.createIndex(indexName, 1);
          expect(createResponse).toBeInstanceOf(
            CreateVectorIndex.AlreadyExists
          );
        }
      );
    });

    it('should create and list an index', async () => {
      const indexName = testIndexName();
      await WithIndex(
        vectorClient,
        indexName,
        10,
        SimilarityMetric.INNER_PRODUCT,
        async () => {
          const listResponse = await vectorClient.listIndexes();
          expectWithMessage(() => {
            expect(listResponse).toBeInstanceOf(ListVectorIndexes.Success);
          }, `expected SUCCESS but got ${listResponse.toString()}`);
          if (listResponse instanceof ListVectorIndexes.Success) {
            const caches = listResponse.getIndexNames();
            expect(caches.includes(indexName)).toBeTruthy();
          }
        }
      );
    });

    it('should delete an index', async () => {
      const indexName = testIndexName();
      const createResponse = await vectorClient.createIndex(indexName, 1);
      expect(createResponse).toBeInstanceOf(CreateVectorIndex.Success);
      const deleteResponse = await vectorClient.deleteIndex(indexName);
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(DeleteVectorIndex.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);
    });
  });
}
