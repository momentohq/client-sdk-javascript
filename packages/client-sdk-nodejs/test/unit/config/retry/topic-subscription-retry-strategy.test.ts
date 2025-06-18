import {
  CancelledError,
  DefaultMomentoLogger,
  DefaultMomentoLoggerLevel,
  InternalServerError,
} from '../../../../src';
import {TopicSubscriptionRetryStrategy} from '../../../../src/config/retry/topic-subscription-retry-strategy';

describe('TopicSubscriptionRetryStrategy', () => {
  const testLogger = new DefaultMomentoLogger(
    'TopicSubscriptionRetryEligibilityStrategyTest',
    DefaultMomentoLoggerLevel.DEBUG
  );

  const testCases = [
    {
      description: 'should return 500 for default config',
      retryStrategy: new TopicSubscriptionRetryStrategy({
        logger: testLogger,
      }),
      sdkError: new InternalServerError('test error'),
      expected: 500,
    },
    {
      description: 'should return 1000 for configured retry delay',
      retryStrategy: new TopicSubscriptionRetryStrategy({
        logger: testLogger,
        retryDelayMillis: 1000,
      }),
      sdkError: new InternalServerError('test error'),
      expected: 1000,
    },
    {
      description: 'should return 0 (no delay) for configured retry delay',
      retryStrategy: new TopicSubscriptionRetryStrategy({
        logger: testLogger,
        retryDelayMillis: 0,
      }),
      sdkError: new InternalServerError('test error'),
      expected: 0,
    },
    {
      description: 'should return null for non-retryable sdkError',
      retryStrategy: new TopicSubscriptionRetryStrategy({
        logger: testLogger,
      }),
      sdkError: new CancelledError('test error'),
      expected: null,
    },
  ];

  testCases.forEach(({description, retryStrategy, sdkError, expected}) => {
    it(description, () => {
      const retryDelayMillis = retryStrategy.determineWhenToResubscribe({
        sdkError,
      });
      expect(retryDelayMillis).toBe(expected);
    });
  });
});
