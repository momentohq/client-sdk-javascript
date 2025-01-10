export class TestRetryMetricsCollector {
  // Data structure to store timestamps: cacheName -> requestName -> [timestamps]
  private readonly data: Record<string, Record<string, number[]>>;

  constructor() {
    this.data = {};
  }

  /**
   * Adds a timestamp for a specific request and cache.
   * @param cacheName - The name of the cache.
   * @param requestName - The name of the request (could also be an enum like MomentoRpcs).
   * @param timestamp - The timestamp to record (in milliseconds).
   */
  addTimestamp(
    cacheName: string,
    requestName: string,
    timestamp: number
  ): void {
    if (!this.data[cacheName]) {
      this.data[cacheName] = {};
    }
    if (!this.data[cacheName][requestName]) {
      this.data[cacheName][requestName] = [];
    }
    this.data[cacheName][requestName].push(timestamp);
  }

  /**
   * Calculates the total retry count for a specific cache and request.
   * @param cacheName - The name of the cache.
   * @param requestName - The name of the request.
   * @returns The total number of retries.
   */
  getTotalRetryCount(cacheName: string, requestName: string): number {
    const timestamps = this.data[cacheName]?.[requestName] ?? [];
    return timestamps.length;
  }

  /**
   * Calculates the average time between retries for a specific cache and request.
   * @param cacheName - The name of the cache.
   * @param requestName - The name of the request.
   * @returns The average time in milliseconds, or null if there are no retries.
   */
  getAverageTimeBetweenRetries(
    cacheName: string,
    requestName: string
  ): number | null {
    const timestamps = this.data[cacheName]?.[requestName] ?? [];
    if (timestamps.length < 2) {
      // No retries occurred.
      return null;
    }
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    const totalInterval = intervals.reduce(
      (sum, interval) => sum + interval,
      0
    );
    return totalInterval / intervals.length;
  }

  /**
   * Retrieves all collected metrics for debugging or analysis.
   * @returns The complete data structure with all recorded metrics.
   */
  getAllMetrics(): Record<string, Record<string, number[]>> {
    return this.data;
  }
}
