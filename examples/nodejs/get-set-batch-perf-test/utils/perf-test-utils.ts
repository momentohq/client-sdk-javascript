import {MomentoLogger} from '@gomomento/sdk';
import {RequestType} from './perf-test-options';

export function getElapsedMillis(startTime: [number, number]): number {
  const endTime = process.hrtime(startTime);
  return (endTime[0] * 1e9 + endTime[1]) / 1e6;
}

export function calculateSummary(
  totalRequests: number,
  totalItemSizeBytes: number,
  runDurationForTests: number,
  batchSize: number,
  itemSizeBytes: number,
  completionTimes: number[],
  requestType: RequestType,
  logger: MomentoLogger
): void {
  const minTime = Math.min(...completionTimes);
  const maxTime = Math.max(...completionTimes);
  const averageTime = completionTimes.reduce((acc, curr) => acc + curr, 0) / completionTimes.length;
  let summaryMessage = '';
  if (requestType === RequestType.ASYNC_GETS || requestType === RequestType.ASYNC_SETS) {
    summaryMessage += `
\n======= Summary of ${requestType} requests for batch size ${batchSize} and item size ${itemSizeBytes} bytes  =======
Min time: ${minTime.toFixed(2)} milliseconds
Max time: ${maxTime.toFixed(2)} milliseconds
Average time: ${averageTime.toFixed(2)} milliseconds
Total requests: ${totalRequests}
Total item size in bytes: ${totalItemSizeBytes} bytes
Total run duration: ${runDurationForTests} seconds
====================================================================================================================\n
`;
  } else {
    summaryMessage += `
\n======= Summary of ${requestType} requests for batch size ${batchSize} and item size ${itemSizeBytes} bytes  =======
Total requests: ${totalRequests}
Total item size in bytes: ${totalItemSizeBytes} bytes
Total run duration: ${runDurationForTests} seconds
====================================================================================================================\n
`;
  }
  logger.info(summaryMessage);
}
