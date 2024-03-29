import {MomentoLoggerFactory} from '@gomomento/sdk';
import * as hdr from 'hdr-histogram-js';

export interface PerfTestContext {
  startTime: [number, number];
  totalItemSizeBytes: number;
  asyncGetLatencies: hdr.Histogram;
  asyncSetLatencies: hdr.Histogram;
  setBatchLatencies: hdr.Histogram;
  getBatchLatencies: hdr.Histogram;
}

export function initiatePerfTestContext(): PerfTestContext {
  return {
    startTime: process.hrtime(),
    totalItemSizeBytes: 0,
    asyncGetLatencies: hdr.build(),
    asyncSetLatencies: hdr.build(),
    setBatchLatencies: hdr.build(),
    getBatchLatencies: hdr.build(),
  };
}

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
