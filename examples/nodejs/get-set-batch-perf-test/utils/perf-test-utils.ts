import {MomentoLogger} from '@gomomento/sdk';

export enum RequestType {
  ASYNC_GETS = 'ASYNC_GETS',
  ASYNC_SETS = 'ASYNC_SETS',
  GET_BATCH = 'GET_BATCH',
  SET_BATCH = 'SET_BATCH',
}

export function getElapsedMillis(startTime: [number, number]): number {
  const endTime = process.hrtime(startTime);
  return (endTime[0] * 1e9 + endTime[1]) / 1e6;
}

export function calculateSummary(
  completionTimes: number[],
  elapsedMillis: number,
  batchSize: number,
  totalRequestSizeInMb: number,
  logger: MomentoLogger,
  requestType: RequestType
): void {
  // Calculate summary statistics
  const totalTime = elapsedMillis;
  const minTime = Math.min(...completionTimes);
  const maxTime = Math.max(...completionTimes);
  const averageTime = completionTimes.reduce((acc, curr) => acc + curr, 0) / completionTimes.length;
  const totalCount = batchSize;
  let summaryMessage = `\n======= Summary of ${requestType} requests =======`;
  // Log summary statistics
  if (requestType === RequestType.ASYNC_GETS || requestType === RequestType.ASYNC_SETS) {
    // Construct summary message
    summaryMessage += `\nTotal requests         : ${totalCount}`;
    summaryMessage += `\nTotal Request Size     : ${totalRequestSizeInMb} MB`;
    summaryMessage += `\nMin time               : ${minTime.toFixed(2)} milliseconds`;
    summaryMessage += `\nMax time               : ${maxTime.toFixed(2)} milliseconds`;
    summaryMessage += `\nAverage time           : ${averageTime.toFixed(2)} milliseconds`;
    summaryMessage += `\nTotal time             : ${totalTime.toFixed(2)} milliseconds`;
    summaryMessage += '\n' + '='.repeat(50) + '\n';
  } else {
    summaryMessage += `\nTotal requests         : ${totalCount}`;
    summaryMessage += `\nTotal Request Size     : ${totalRequestSizeInMb} MB`;
    summaryMessage += `\nTotal time             : ${totalTime.toFixed(2)} milliseconds`;
    summaryMessage += '\n' + '='.repeat(50) + '\n';
  }
  logger.info(summaryMessage);
}
