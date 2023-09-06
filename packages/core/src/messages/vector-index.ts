export interface VectorIndexItem {
  id: string;
  vector: Array<number>;
  metadata?: Record<string, string>;
}
