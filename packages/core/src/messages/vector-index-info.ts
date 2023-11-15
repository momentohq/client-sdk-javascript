import {VectorSimilarityMetric} from '../internal/clients';

export class VectorIndexInfo {
  private readonly _name: string;
  private readonly _numDimensions: number;
  private readonly _similarityMetric: VectorSimilarityMetric;

  constructor(
    name: string,
    numDimensions: number,
    similarityMetric: VectorSimilarityMetric
  ) {
    this._name = name;
    this._numDimensions = numDimensions;
    this._similarityMetric = similarityMetric;
  }

  public get name(): string {
    return this._name;
  }

  public getName(): string {
    return this._name;
  }

  public getNumDimensions(): number {
    return this._numDimensions;
  }

  public get numDimensions(): number {
    return this._numDimensions;
  }

  public getSimilarityMetric(): VectorSimilarityMetric {
    return this._similarityMetric;
  }

  public get similarityMetric(): VectorSimilarityMetric {
    return this._similarityMetric;
  }

  public toString(): string {
    return `VectorIndexInfo('${this._name}', ${this._numDimensions}, '${this._similarityMetric}')`;
  }

  public equals(other: VectorIndexInfo): boolean {
    return (
      this._name === other._name &&
      this._numDimensions === other._numDimensions &&
      this._similarityMetric === other._similarityMetric
    );
  }
}
