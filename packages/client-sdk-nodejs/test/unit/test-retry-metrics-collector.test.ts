import {TestRetryMetricsCollector} from '../test-retry-metrics-collector';
import {MomentoRPCMethod} from '../../src/config/retry/momento-rpc-method';

describe('TestRetryMetricsCollector', () => {
  let metricsCollector: TestRetryMetricsCollector;

  beforeEach(() => {
    metricsCollector = new TestRetryMetricsCollector();
  });

  test('should initialize with an empty data structure', () => {
    expect(metricsCollector.getAllMetrics()).toEqual({});
  });

  test('should add a timestamp and retrieve total retry count', () => {
    metricsCollector.addTimestamp('myCache', MomentoRPCMethod.Get, 1673000000);

    const retryCount = metricsCollector.getTotalRetryCount(
      'myCache',
      MomentoRPCMethod.Get
    );

    expect(retryCount).toBe(0);
  });

  test('should calculate average time between retries', () => {
    metricsCollector.addTimestamp('myCache', MomentoRPCMethod.Get, 1673000000);
    metricsCollector.addTimestamp('myCache', MomentoRPCMethod.Get, 1673000010); // 10 seconds later
    metricsCollector.addTimestamp('myCache', MomentoRPCMethod.Get, 1673000020); // Another 10 seconds later

    const avgTime = metricsCollector.getAverageTimeBetweenRetries(
      'myCache',
      MomentoRPCMethod.Get
    );

    expect(avgTime).toBe(10); // 10 seconds between each retry
  });

  test('should return null for average time when there are no retries', () => {
    const avgTime = metricsCollector.getAverageTimeBetweenRetries(
      'myCache',
      MomentoRPCMethod.Get
    );

    expect(avgTime).toBe(0);
  });

  test('should handle multiple caches and requests', () => {
    metricsCollector.addTimestamp('myCache1', MomentoRPCMethod.Get, 1673000000);
    metricsCollector.addTimestamp('myCache1', MomentoRPCMethod.Get, 1673000010);
    metricsCollector.addTimestamp('myCache2', MomentoRPCMethod.Set, 1673000005);
    metricsCollector.addTimestamp('myCache2', MomentoRPCMethod.Set, 1673000015);

    const retryCountCache1 = metricsCollector.getTotalRetryCount(
      'myCache1',
      MomentoRPCMethod.Get
    );
    const retryCountCache2 = metricsCollector.getTotalRetryCount(
      'myCache2',
      MomentoRPCMethod.Set
    );
    const avgTimeCache1 = metricsCollector.getAverageTimeBetweenRetries(
      'myCache1',
      MomentoRPCMethod.Get
    );
    const avgTimeCache2 = metricsCollector.getAverageTimeBetweenRetries(
      'myCache2',
      MomentoRPCMethod.Set
    );

    expect(retryCountCache1).toBe(1);
    expect(retryCountCache2).toBe(1);
    expect(avgTimeCache1).toBe(10);
    expect(avgTimeCache2).toBe(10);
  });

  test('should return 0 for total retry count when no timestamps exist', () => {
    const retryCount = metricsCollector.getTotalRetryCount(
      'nonExistentCache',
      MomentoRPCMethod.Get
    );

    expect(retryCount).toBe(0);
  });

  test('should retrieve all metrics', () => {
    metricsCollector.addTimestamp('myCache1', MomentoRPCMethod.Get, 1673000000);
    metricsCollector.addTimestamp('myCache1', MomentoRPCMethod.Get, 1673000010);
    metricsCollector.addTimestamp('myCache1', MomentoRPCMethod.Set, 1673000020);

    metricsCollector.addTimestamp('myCache2', MomentoRPCMethod.Get, 1673000000);
    metricsCollector.addTimestamp(
      'myCache2',
      MomentoRPCMethod.Delete,
      1673000010
    );
    metricsCollector.addTimestamp('myCache2', MomentoRPCMethod.Set, 1673000020);

    const allMetrics = metricsCollector.getAllMetrics();

    expect(allMetrics).toEqual({
      myCache1: {
        [MomentoRPCMethod.Get]: [1673000000, 1673000010],
        [MomentoRPCMethod.Set]: [1673000020],
      },
      myCache2: {
        [MomentoRPCMethod.Get]: [1673000000],
        [MomentoRPCMethod.Delete]: [1673000010],
        [MomentoRPCMethod.Set]: [1673000020],
      },
    });
  });
});
