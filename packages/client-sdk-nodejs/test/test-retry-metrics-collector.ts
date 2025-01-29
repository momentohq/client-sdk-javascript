import {MomentoRPCMethod} from './momento-rpc-method';

export class TestRetryMetricsCollector {
  // Data structure to store timestamps: cacheName -> requestName -> [timestamps]
  private readonly data: Record<string, Record<MomentoRPCMethod, number[]>>;

  constructor() {
    this.data = {};
  }

  /**
   * Adds a timestamp for a specific request and cache.
   * @param cacheName - The name of the cache.
   * @param requestName - The name of the request.
   * @param timestamp - The timestamp to record in seconds since epoch.
   */
  addTimestamp(
    cacheName: string,
    requestName: MomentoRPCMethod,
    timestamp: number
  ): void {
    this.data[cacheName] = this.data[cacheName] || {};
    this.data[cacheName][requestName] = this.data[cacheName][requestName] || [];
    this.data[cacheName][requestName].push(timestamp);
  }

  /**
   * Calculates the total retry count for a specific cache and request.
   * @param cacheName - The name of the cache.
   * @param requestName - The name of the request.
   * @returns The total number of retries.
   */
  getTotalRetryCount(cacheName: string, requestName: MomentoRPCMethod): number {
    const timestamps = this.data[cacheName]?.[requestName] || [];
    // Number of retries is one less than the number of timestamps.
    return Math.max(0, timestamps.length - 1);
  }

  /**
   * Calculates the average time between retries for a specific cache and request.
   * @param cacheName - The name of the cache.
   * @param requestName - The name of the request.
   * @returns The average time in seconds, or `0` if there are no retries.
   */
  getAverageTimeBetweenRetries(
    cacheName: string,
    requestName: MomentoRPCMethod
  ): number {
    const timestamps = this.data[cacheName]?.[requestName] || [];
    if (timestamps.length < 2) {
      return 0; // No retries occurred.
    }
    const totalInterval = timestamps
      .slice(1)
      .reduce(
        (sum, timestamp, index) => sum + (timestamp - timestamps[index]),
        0
      );
    return totalInterval / (timestamps.length - 1);
  }

  /**
   * Retrieves all collected metrics for debugging or analysis.
   * @returns The complete data structure with all recorded metrics.
   */
  getAllMetrics(): Record<string, Record<MomentoRPCMethod, number[]>> {
    return this.data;
  }
}
