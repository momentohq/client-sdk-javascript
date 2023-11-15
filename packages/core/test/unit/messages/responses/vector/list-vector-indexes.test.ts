import {
  VectorSimilarityMetric,
  VectorIndexInfo,
  ListVectorIndexes,
} from '../../../../../src';

describe('list-vector-indexes.ts', () => {
  it('should correctly print a ListVectorIndexes.Success object', () => {
    const indexes = [
      new VectorIndexInfo(
        'test-index',
        10,
        VectorSimilarityMetric.INNER_PRODUCT
      ),
    ];
    const listIndexesResponse = new ListVectorIndexes.Success(indexes);
    expect(listIndexesResponse.toString()).toEqual(
      "Success: [VectorIndexInfo('test-index', 10, 'INNER_PRODUCT')]"
    );
  });
});
