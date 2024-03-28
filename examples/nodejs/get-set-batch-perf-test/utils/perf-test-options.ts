import {MomentoLoggerFactory} from '@gomomento/sdk';

export enum RequestType {
  ASYNC_GETS = 'ASYNC_GETS',
  ASYNC_SETS = 'ASYNC_SETS',
  GET_BATCH = 'GET_BATCH',
  SET_BATCH = 'SET_BATCH',
}
export interface PerfTestOptions {
  loggerFactory: MomentoLoggerFactory;
  requestTimeoutMs: number;
}

export interface PerfTestConfiguration {
  minimumRunDurationSecondsForTests: number;
  sets: GetSetConfig[];
  gets: GetSetConfig[];
}

export interface GetSetConfig {
  batchSize: number;
  itemSizeBytes: number;
}
