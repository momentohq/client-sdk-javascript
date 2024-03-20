export enum ReadConcern {
  // BALANCED is the default read concern for the cache client.
  BALANCED = 'balanced',
  // CONSISTENT read concern guarantees read after write consistency.
  CONSISTENT = 'consistent',
  // EXPRESS read concern optimizes for low latency at the cost of consistency.
  EXPRESS = 'express',
}
