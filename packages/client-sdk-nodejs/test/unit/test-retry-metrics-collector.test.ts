import {TestRetryMetricsCollector} from '../integration/test-retry-metrics-collector';

describe('TestRetryMetricsCollector', () => {
  let metricsCollector: TestRetryMetricsCollector;

  beforeEach(() => {
    metricsCollector = new TestRetryMetricsCollector();
  });

  test('should initialize with an empty data structure', () => {
    expect(metricsCollector.getAllMetrics()).toEqual({});
  });

  test('should add a timestamp and retrieve total retry count', () => {
    metricsCollector.addTimestamp('myCache', 'Get', 1673000000);

    const retryCount = metricsCollector.getTotalRetryCount('myCache', 'Get');

    expect(retryCount).toBe(1);
  });

  test('should calculate average time between retries', () => {
    metricsCollector.addTimestamp('myCache', 'Get', 1673000000);
    metricsCollector.addTimestamp('myCache', 'Get', 1673000010); // 10 seconds later
    metricsCollector.addTimestamp('myCache', 'Get', 1673000020); // Another 10 seconds later

    const avgTime = metricsCollector.getAverageTimeBetweenRetries(
      'myCache',
      'Get'
    );

    expect(avgTime).toBe(10); // 10 seconds between each retry
  });

  test('should return null for average time when there are no retries', () => {
    metricsCollector.addTimestamp('myCache', 'Get', 1673000000);

    const avgTime = metricsCollector.getAverageTimeBetweenRetries(
      'myCache',
      'Get'
    );

    expect(avgTime).toBeNull();
  });

  test('should handle multiple caches and requests', () => {
    metricsCollector.addTimestamp('myCache1', 'Get', 1673000000);
    metricsCollector.addTimestamp('myCache1', 'Get', 1673000010);
    metricsCollector.addTimestamp('myCache2', 'Set', 1673000005);
    metricsCollector.addTimestamp('myCache2', 'Set', 1673000015);

    const retryCountCache1 = metricsCollector.getTotalRetryCount(
      'myCache1',
      'Get'
    );
    const retryCountCache2 = metricsCollector.getTotalRetryCount(
      'myCache2',
      'Set'
    );
    const avgTimeCache1 = metricsCollector.getAverageTimeBetweenRetries(
      'myCache1',
      'Get'
    );
    const avgTimeCache2 = metricsCollector.getAverageTimeBetweenRetries(
      'myCache2',
      'Set'
    );

    expect(retryCountCache1).toBe(2);
    expect(retryCountCache2).toBe(2);
    expect(avgTimeCache1).toBe(10);
    expect(avgTimeCache2).toBe(10);
  });

  test('should return 0 for total retry count when no timestamps exist', () => {
    const retryCount = metricsCollector.getTotalRetryCount(
      'nonExistentCache',
      'Get'
    );

    expect(retryCount).toBe(0);
  });

  test('should retrieve all metrics', () => {
    metricsCollector.addTimestamp('myCache1', 'Get', 1673000000);
    metricsCollector.addTimestamp('myCache1', 'Get', 1673000010);
    metricsCollector.addTimestamp('myCache1', 'Set', 1673000020);

    metricsCollector.addTimestamp('myCache2', 'Get', 1673000000);
    metricsCollector.addTimestamp('myCache2', 'Delete', 1673000010);
    metricsCollector.addTimestamp('myCache2', 'Set', 1673000020);

    const allMetrics = metricsCollector.getAllMetrics();

    expect(allMetrics).toEqual({
      myCache1: {
        Get: [1673000000, 1673000010],
        Set: [1673000020],
      },
      myCache2: {
        Get: [1673000000],
        Delete: [1673000010],
        Set: [1673000020],
      },
    });
  });
});
