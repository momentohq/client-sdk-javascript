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
  VectorIndexInfo,
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
      const indexName = testIndexName('control-create-with-bad-metric');
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
      const indexName = testIndexName('control-delete-non-existent');
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
      const indexName = testIndexName('control-create-already-exists');
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
        indexInfo: new VectorIndexInfo(
          testIndexName('control-list-indexes-1'),
          10,
          VectorSimilarityMetric.INNER_PRODUCT
        ),
      },
      {
        indexInfo: new VectorIndexInfo(
          testIndexName('control-list-indexes-2'),
          20,
          VectorSimilarityMetric.EUCLIDEAN_SIMILARITY
        ),
      },
      {
        indexInfo: new VectorIndexInfo(
          testIndexName('control-list-indexes-3'),
          30,
          VectorSimilarityMetric.COSINE_SIMILARITY
        ),
      },
    ])('should create and list an index', async ({indexInfo}) => {
      await WithIndex(
        vectorClient,
        indexInfo.name,
        indexInfo.numDimensions,
        indexInfo.similarityMetric,
        async () => {
          const listResponse = await vectorClient.listIndexes();
          expectWithMessage(() => {
            expect(listResponse).toBeInstanceOf(ListVectorIndexes.Success);
          }, `expected SUCCESS but got ${listResponse.toString()}`);
          if (listResponse instanceof ListVectorIndexes.Success) {
            expect(
              listResponse
                .getIndexes()
                .map(thisIndexInfo => thisIndexInfo.equals(indexInfo))
            ).toBeTruthy();
          }
        }
      );
    });

    it('should delete an index', async () => {
      const indexName = testIndexName('control-delete-index');
      const createResponse = await vectorClient.createIndex(indexName, 1);
      expect(createResponse).toBeInstanceOf(CreateVectorIndex.Success);
      const deleteResponse = await vectorClient.deleteIndex(indexName);
      expectWithMessage(() => {
        expect(deleteResponse).toBeInstanceOf(DeleteVectorIndex.Success);
      }, `expected SUCCESS but got ${deleteResponse.toString()}`);
    });
  });
}
