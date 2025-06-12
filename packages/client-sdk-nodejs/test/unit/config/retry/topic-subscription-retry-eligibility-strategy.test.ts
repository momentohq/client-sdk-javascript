import {
  AuthenticationError,
  CacheNotFoundError,
  CancelledError,
  DefaultMomentoLogger,
  DefaultMomentoLoggerLevel,
  InternalServerError,
  PermissionError,
} from '../../../../src';
import {TopicSubscriptionRetryEligibilityStrategy} from '../../../../src/config/retry/topic-subscription-retry-eligibility-strategy';
import {Status} from '@grpc/grpc-js/build/src/constants';

describe('TopicSubscriptionRetryEligibilityStrategy', () => {
  const testLogger = new DefaultMomentoLogger(
    'TopicSubscriptionRetryEligibilityStrategyTest',
    DefaultMomentoLoggerLevel.DEBUG
  );
  const eligibilityStrategy = new TopicSubscriptionRetryEligibilityStrategy(
    testLogger
  );

  const testCases = [
    {
      description: 'should return true for INTERNAL_SERVER_ERROR',
      sdkError: new InternalServerError('test error'),
      expected: true,
    },
    {
      description: 'should return false for CANCELLED_ERROR',
      sdkError: new CancelledError('test error'),
      expected: false,
    },
    {
      description: 'should return false for CACHE_NOT_FOUND_ERROR',
      sdkError: new CacheNotFoundError('test error'),
      expected: false,
    },
    {
      description: 'should return false for PERMISSION_ERROR',
      sdkError: new PermissionError('test error'),
      expected: false,
    },
    {
      description: 'should return false for AUTHENTICATION_ERROR',
      sdkError: new AuthenticationError('test error', Status.UNAUTHENTICATED),
      expected: false,
    },
  ];

  testCases.forEach(({description, sdkError, expected}) => {
    it(description, () => {
      const isEligible = eligibilityStrategy.isEligibleForResubscribe({
        sdkError,
      });
      expect(isEligible).toBe(expected);
    });
  });
});
