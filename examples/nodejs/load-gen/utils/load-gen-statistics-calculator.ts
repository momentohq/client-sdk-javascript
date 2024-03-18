import {BasicLoadGenContext, RequestCoalescerContext} from './load-gen';
import * as hdr from 'hdr-histogram-js';
import {MomentoLogger} from '@gomomento/sdk';

export function tps(context: BasicLoadGenContext, requestCount: number): number {
  return Math.round((requestCount * 1000) / getElapsedMillis(context.startTime));
}

export function getElapsedMillis(startTime: [number, number]): number {
  const endTime = process.hrtime(startTime);
  return (endTime[0] * 1e9 + endTime[1]) / 1e6;
}

export function percentRequests(context: BasicLoadGenContext, count: number): string {
  return (Math.round((count / context.globalRequestCount) * 100 * 10) / 10).toString();
}

export function outputHistogramSummary(histogram: hdr.Histogram): string {
  return `
  count: ${histogram.totalCount}
    min: ${histogram.minNonZeroValue}
    p50: ${histogram.getValueAtPercentile(50)}
    p90: ${histogram.getValueAtPercentile(90)}
    p99: ${histogram.getValueAtPercentile(99)}
  p99.9: ${histogram.getValueAtPercentile(99.9)}
    max: ${histogram.maxValue}
`;
}

export function logStats(
  loadGenContext: BasicLoadGenContext,
  logger: MomentoLogger,
  maxRequestsPerSecond: number
): void {
  logger.info(`
cumulative stats:
total requests: ${loadGenContext.globalRequestCount} (${tps(
    loadGenContext,
    loadGenContext.globalRequestCount
  )} tps, limited to ${maxRequestsPerSecond} tps)
       success: ${loadGenContext.globalSuccessCount} (${percentRequests(
    loadGenContext,
    loadGenContext.globalSuccessCount
  )}%) (${tps(loadGenContext, loadGenContext.globalSuccessCount)} tps)
   unavailable: ${loadGenContext.globalUnavailableCount} (${percentRequests(
    loadGenContext,
    loadGenContext.globalUnavailableCount
  )}%)
deadline exceeded: ${loadGenContext.globalDeadlineExceededCount} (${percentRequests(
    loadGenContext,
    loadGenContext.globalDeadlineExceededCount
  )}%)
resource exhausted: ${loadGenContext.globalResourceExhaustedCount} (${percentRequests(
    loadGenContext,
    loadGenContext.globalResourceExhaustedCount
  )}%)
    rst stream: ${loadGenContext.globalRstStreamCount} (${percentRequests(
    loadGenContext,
    loadGenContext.globalRstStreamCount
  )}%)
    cancelled: ${loadGenContext.globalCancelledCount} (${percentRequests(
    loadGenContext,
    loadGenContext.globalCancelledCount
  )}%)

cumulative set latencies:
${outputHistogramSummary(loadGenContext.setLatencies)}

cumulative get latencies:
${outputHistogramSummary(loadGenContext.getLatencies)}
`);
}

export function logCoalescingStats(
  context: RequestCoalescerContext,
  loadGenContext: BasicLoadGenContext,
  logger: MomentoLogger
): void {
  logger.info(`
For request coalescer:
Number of set requests coalesced:
${context.numberOfSetRequestsCoalesced} (${percentRequests(loadGenContext, context.numberOfSetRequestsCoalesced)}%)

Number of get requests coalesced:
${context.numberOfGetRequestsCoalesced} (${percentRequests(loadGenContext, context.numberOfGetRequestsCoalesced)}%)
`);
}
