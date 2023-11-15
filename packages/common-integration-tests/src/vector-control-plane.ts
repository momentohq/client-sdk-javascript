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
  VectorSimilarityMetric,
} from '@gomomento/sdk-core';

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
      const createResponse = await vectorClient.createIndex(
        indexName,
        1,
        'badMetric' as unknown as VectorSimilarityMetric
      );
      expectWithMessage(() => {
        expect(createResponse).toBeInstanceOf(CreateVectorIndex.Error);
      }, `expected ERROR but got ${createResponse.toString()}`);
      if (createResponse instanceof CreateVectorIndex.Error) {
        expect(createResponse.errorCode()).toEqual(
          MomentoErrorCode.INVALID_ARGUMENT_ERROR
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
        VectorSimilarityMetric.INNER_PRODUCT,
        async () => {
          const createResponse = await vectorClient.createIndex(indexName, 1);
          expect(createResponse).toBeInstanceOf(
            CreateVectorIndex.AlreadyExists
          );
        }
      );
    });

    it.each([
      {
        indexName: testIndexName(),
        numDimensions: 10,
        similarityMetric: VectorSimilarityMetric.INNER_PRODUCT,
      },
      {
        indexName: testIndexName(),
        numDimensions: 20,
        similarityMetric: VectorSimilarityMetric.EUCLIDEAN_SIMILARITY,
      },
      {
        indexName: testIndexName(),
        numDimensions: 30,
        similarityMetric: VectorSimilarityMetric.COSINE_SIMILARITY,
      },
    ])(
      'should create and list an index',
      async ({indexName, numDimensions, similarityMetric}) => {
        await WithIndex(
          vectorClient,
          indexName,
          numDimensions,
          similarityMetric,
          async () => {
            const listResponse = await vectorClient.listIndexes();
            expectWithMessage(() => {
              expect(listResponse).toBeInstanceOf(ListVectorIndexes.Success);
            }, `expected SUCCESS but got ${listResponse.toString()}`);
            if (listResponse instanceof ListVectorIndexes.Success) {
              listResponse.getIndexes().forEach(indexInfo => {
                if (indexInfo.getName() === indexName) {
                  expect(indexInfo.getNumDimensions()).toEqual(numDimensions);
                  expect(indexInfo.getSimilarityMetric()).toEqual(
                    similarityMetric
                  );
                }
              });
              expect(
                listResponse
                  .getIndexes()
                  .map(indexInfo => indexInfo.getName() === indexName)
              ).toBeTruthy();
            }
          }
        );
      }
    );

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
