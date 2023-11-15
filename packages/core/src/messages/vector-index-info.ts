import {VectorSimilarityMetric} from '../internal/clients';

export class VectorIndexInfo {
  private readonly name: string;
  private readonly numDimensions: number;
  private readonly similarityMetric: VectorSimilarityMetric;

  constructor(
    name: string,
    numDimensions: number,
    similarityMetric: VectorSimilarityMetric
  ) {
    this.name = name;
    this.numDimensions = numDimensions;
    this.similarityMetric = similarityMetric;
  }

  public getName(): string {
    return this.name;
  }

  public getNumDimensions(): number {
    return this.numDimensions;
  }

  public getSimilarityMetric(): VectorSimilarityMetric {
    return this.similarityMetric;
  }
}
