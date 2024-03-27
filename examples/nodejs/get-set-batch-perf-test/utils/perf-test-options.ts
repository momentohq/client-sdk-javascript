import {MomentoLoggerFactory} from '@gomomento/sdk';

export interface PerfTestOptions {
  loggerFactory: MomentoLoggerFactory;
  requestTimeoutMs: number;
  batchSize: number;
  itemSizeBytesInMb: number;
  numberOfBatches: number;
}
