import {VectorSimilarityMetric, VectorIndexInfo} from '../../../../src';

describe('vector-index-info.ts', () => {
  it('should correctly instantiate a VectorIndexInfo object', () => {
    const indexName = 'test-index';
    const numDimensions = 10;
    const similarityMetric = VectorSimilarityMetric.INNER_PRODUCT;
    const vectorIndexInfo = new VectorIndexInfo(
      indexName,
      numDimensions,
      similarityMetric
    );
    expect(vectorIndexInfo.name).toEqual(indexName);
    expect(vectorIndexInfo.numDimensions).toEqual(numDimensions);
    expect(vectorIndexInfo.similarityMetric).toEqual(similarityMetric);
    expect(vectorIndexInfo.toString()).toEqual(
      `VectorIndexInfo('${indexName}', ${numDimensions}, '${similarityMetric}')`
    );
  });
});
