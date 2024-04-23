import {MomentoLogger} from '@gomomento/sdk';
import {PerfTestContext, RequestType} from './perf-test-options';
import * as hdr from 'hdr-histogram-js';
import * as fs from 'fs';

export function getElapsedMillis(startTime: [number, number]): number {
  const endTime = process.hrtime(startTime);
  return (endTime[0] * 1e9 + endTime[1]) / 1e6;
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

export function calculateSummary(
  context: PerfTestContext,
  batchSize: number,
  itemSizeBytes: number,
  requestType: RequestType,
  logger: MomentoLogger,
  useMaxConcurrentRequests: boolean
): void {
  const histogram = getRequestHistogram(context, requestType);
  const summaryMessage = generateSummaryMessage(
    requestType,
    histogram,
    batchSize,
    itemSizeBytes,
    context.totalItemSizeBytes,
    useMaxConcurrentRequests
  );

  logger.info(summaryMessage);

  // Write the statistics to a CSV file
  writeStatsToCSV(
    requestType,
    batchSize,
    itemSizeBytes,
    histogram,
    context.totalItemSizeBytes,
    useMaxConcurrentRequests
  );
}

function getRequestHistogram(context: PerfTestContext, requestType: RequestType): hdr.Histogram {
  switch (requestType) {
    case RequestType.ASYNC_SETS:
      return context.asyncSetLatencies;
    case RequestType.ASYNC_GETS:
      return context.asyncGetLatencies;
    case RequestType.SET_BATCH:
      return context.setBatchLatencies;
    case RequestType.GET_BATCH:
      return context.getBatchLatencies;
  }
}

function generateSummaryMessage(
  requestType: RequestType,
  histogram: hdr.Histogram,
  batchSize: number,
  itemSizeBytes: number,
  totalItemSizeBytes: number,
  useConcurrentRequests: boolean
): string {
  const summaryTitle = `======= Summary of ${requestType} requests for batch size ${batchSize} and item size ${itemSizeBytes} bytes, use max concurrent requests: ${useConcurrentRequests} =======`;
  const histogramSummary = `Cumulative latencies: ${outputHistogramSummary(histogram)}`;
  const totalItemSize = `Total item size in bytes: ${totalItemSizeBytes} bytes`;
  const separator = `${'='.repeat(150)}\n\n`;

  return `${summaryTitle}\n${histogramSummary}\n${totalItemSize}\n${separator}`;
}

function writeStatsToCSV(
  requestType: RequestType,
  batchSize: number,
  itemSize: number,
  histogram: hdr.Histogram,
  totalItemSizeBytes: number,
  useMaxConcurrentRequests: boolean
): void {
  const filename = 'perf_test_stats.csv';
  const header =
    'requestType,BatchSize,itemSize,TotalCount,Min,p50,p90,p99,p99.9,Max,TotalItemSizeBytes,UseMaxConcurrentRequests\n';
  const stats =
    `${requestType},${batchSize},${itemSize},${histogram.totalCount},${histogram.minNonZeroValue},` +
    `${histogram.getValueAtPercentile(50)},${histogram.getValueAtPercentile(90)},${histogram.getValueAtPercentile(
      99
    )},` +
    `${histogram.getValueAtPercentile(99.9)},${histogram.maxValue},${totalItemSizeBytes},${useMaxConcurrentRequests}\n`;

  // Check if the file exists
  if (!fs.existsSync(filename)) {
    // If the file doesn't exist, write the header
    fs.writeFileSync(filename, header);
  }

  // Append the statistics to the file
  fs.appendFileSync(filename, stats);
}
