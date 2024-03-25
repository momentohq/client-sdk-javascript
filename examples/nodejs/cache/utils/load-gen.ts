import {
  CacheGet,
  CacheSet,
  CancelledError,
  InternalServerError,
  LimitExceededError,
  MomentoLogger,
  MomentoLoggerFactory,
  TimeoutError,
} from '@gomomento/sdk';
import * as hdr from 'hdr-histogram-js';

export interface BasicLoadGenOptions {
  loggerFactory: MomentoLoggerFactory;
  requestTimeoutMs: number;
  cacheItemPayloadBytes: number;
  numberOfConcurrentRequests: number;
  showStatsIntervalSeconds: number;
  maxRequestsPerSecond: number;
  totalSecondsToRun: number;
}

export enum AsyncSetGetResult {
  SUCCESS = 'SUCCESS',
  UNAVAILABLE = 'UNAVAILABLE',
  DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  RST_STREAM = 'RST_STREAM',
  CANCELLED = 'CANCELLED',
}

export interface BasicLoadGenContext {
  startTime: [number, number];
  getLatencies: hdr.Histogram;
  setLatencies: hdr.Histogram;
  // TODO: these could be generalized into a map structure that
  //  would make it possible to deal with a broader range of
  //  failure types more succinctly.
  globalRequestCount: number;
  globalSuccessCount: number;
  globalUnavailableCount: number;
  globalDeadlineExceededCount: number;
  globalResourceExhaustedCount: number;
  globalRstStreamCount: number;
  globalCancelledCount: number;
}

export interface RequestCoalescerContext {
  numberOfSetRequestsCoalesced: number;
  numberOfGetRequestsCoalesced: number;
}

export function updateContextCountsForRequest(context: BasicLoadGenContext, result: AsyncSetGetResult): void {
  context.globalRequestCount++;
  // TODO: this could be simplified and made more generic, worth doing if we ever want to
  //  expand this to additional types of behavior
  switch (result) {
    case AsyncSetGetResult.SUCCESS:
      context.globalSuccessCount++;
      break;
    case AsyncSetGetResult.UNAVAILABLE:
      context.globalUnavailableCount++;
      break;
    case AsyncSetGetResult.DEADLINE_EXCEEDED:
      context.globalDeadlineExceededCount++;
      break;
    case AsyncSetGetResult.RESOURCE_EXHAUSTED:
      context.globalResourceExhaustedCount++;
      break;
    case AsyncSetGetResult.RST_STREAM:
      context.globalRstStreamCount++;
      break;
    case AsyncSetGetResult.CANCELLED:
      context.globalCancelledCount++;
      break;
  }
}

export async function executeRequestAndUpdateContextCounts<T>(
  logger: MomentoLogger,
  context: BasicLoadGenContext,
  block: () => Promise<T>
): Promise<T | undefined> {
  const [result, response] = await executeRequest(logger, block);
  updateContextCountsForRequest(context, result);
  return response;
}

export async function executeRequest<T>(
  logger: MomentoLogger,
  block: () => Promise<T>
): Promise<[AsyncSetGetResult, T | undefined]> {
  try {
    const result = await block();
    if (result instanceof CacheSet.Error || result instanceof CacheGet.Error) {
      throw result.innerException();
    }
    return [AsyncSetGetResult.SUCCESS, result];
  } catch (e) {
    if (e instanceof InternalServerError) {
      if (e.message.includes('UNAVAILABLE')) {
        return [AsyncSetGetResult.UNAVAILABLE, undefined];
      } else if (e.message.includes('RST_STREAM')) {
        logger.error(`Caught RST_STREAM error; swallowing: ${e.name}, ${e.message}`);
        return [AsyncSetGetResult.RST_STREAM, undefined];
      } else {
        throw e;
      }
    } else if (e instanceof LimitExceededError) {
      if (e.message.includes('RESOURCE_EXHAUSTED')) {
        logger.error(`Caught RESOURCE_EXHAUSTED error; swallowing: ${e.name}, ${e.message}`);
        return [AsyncSetGetResult.RESOURCE_EXHAUSTED, undefined];
      } else {
        throw e;
      }
    } else if (e instanceof TimeoutError) {
      if (e.message.includes('DEADLINE_EXCEEDED')) {
        return [AsyncSetGetResult.DEADLINE_EXCEEDED, undefined];
      } else {
        throw e;
      }
    } else if (e instanceof CancelledError) {
      if (e.message.includes('CANCELLED')) {
        return [AsyncSetGetResult.CANCELLED, undefined];
      } else {
        throw e;
      }
    } else {
      throw e;
    }
  }
}

export function initiateLoadGenContext(): BasicLoadGenContext {
  const loadGenContext: BasicLoadGenContext = {
    startTime: process.hrtime(),
    getLatencies: hdr.build(),
    setLatencies: hdr.build(),
    globalRequestCount: 0,
    globalSuccessCount: 0,
    globalUnavailableCount: 0,
    globalDeadlineExceededCount: 0,
    globalResourceExhaustedCount: 0,
    globalRstStreamCount: 0,
    globalCancelledCount: 0,
  };
  return loadGenContext;
}

export function initiateRequestCoalescerContext(): RequestCoalescerContext {
  const requestCoalescerContext: RequestCoalescerContext = {
    numberOfSetRequestsCoalesced: 0,
    numberOfGetRequestsCoalesced: 0,
  };
  return requestCoalescerContext;
}
