import {TestRetryMetricsCollector} from '../integration/test-retry-metrics-collector';

describe('TestRetryMetricsCollector', () => {
  let metricsCollector: TestRetryMetricsCollector;

  beforeEach(() => {
    metricsCollector = new TestRetryMetricsCollector();
  });

  test('should initialize with an empty data structure', () => {
    expect(metricsCollector.getAllMetrics()).toEqual({});
  });

  test('should add timestamps correctly', () => {
    metricsCollector.addTimestamp('cache1', 'request1', 100);
    metricsCollector.addTimestamp('cache1', 'request1', 200);

    const metrics = metricsCollector.getAllMetrics();
    expect(metrics['cache1']['request1']).toEqual([100, 200]);
  });

  test('should calculate total retry count correctly', () => {
    metricsCollector.addTimestamp('cache1', 'request1', 100);
    metricsCollector.addTimestamp('cache1', 'request1', 200);
    metricsCollector.addTimestamp('cache1', 'request1', 300);

    const totalRetryCount = metricsCollector.getTotalRetryCount(
      'cache1',
      'request1'
    );
    expect(totalRetryCount).toBe(3);
  });

  test('should return 0 retries for non-existent cache or request', () => {
    const totalRetryCount = metricsCollector.getTotalRetryCount(
      'cache1',
      'nonExistentRequest'
    );
    expect(totalRetryCount).toBe(0);
  });

  test('should calculate average time between retries correctly', () => {
    metricsCollector.addTimestamp('cache1', 'request1', 100);
    metricsCollector.addTimestamp('cache1', 'request1', 300);
    metricsCollector.addTimestamp('cache1', 'request1', 600);

    const averageTime = metricsCollector.getAverageTimeBetweenRetries(
      'cache1',
      'request1'
    );
    expect(averageTime).toBe(250); // (300 - 100 + 600 - 300) / 2
  });

  test('should return null for average time if only one timestamp exists', () => {
    metricsCollector.addTimestamp('cache1', 'request1', 100);

    const averageTime = metricsCollector.getAverageTimeBetweenRetries(
      'cache1',
      'request1'
    );
    expect(averageTime).toBeNull();
  });

  test('should return null for average time for non-existent cache or request', () => {
    const averageTime = metricsCollector.getAverageTimeBetweenRetries(
      'cache1',
      'nonExistentRequest'
    );
    expect(averageTime).toBeNull();
  });

  test('should handle multiple caches and requests correctly', () => {
    metricsCollector.addTimestamp('cache1', 'request1', 100);
    metricsCollector.addTimestamp('cache1', 'request1', 200);

    metricsCollector.addTimestamp('cache2', 'request2', 300);
    metricsCollector.addTimestamp('cache2', 'request2', 600);

    expect(metricsCollector.getTotalRetryCount('cache1', 'request1')).toBe(2);
    expect(
      metricsCollector.getAverageTimeBetweenRetries('cache1', 'request1')
    ).toBe(100);

    expect(metricsCollector.getTotalRetryCount('cache2', 'request2')).toBe(2);
    expect(
      metricsCollector.getAverageTimeBetweenRetries('cache2', 'request2')
    ).toBe(300);
  });

  test('should return the full metrics data structure', () => {
    metricsCollector.addTimestamp('cache1', 'request1', 100);
    metricsCollector.addTimestamp('cache1', 'request1', 200);

    const allMetrics = metricsCollector.getAllMetrics();
    expect(allMetrics).toEqual({
      cache1: {
        request1: [100, 200],
      },
    });
  });
});
