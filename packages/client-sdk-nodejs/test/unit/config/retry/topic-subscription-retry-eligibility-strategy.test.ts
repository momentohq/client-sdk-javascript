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
// import {Metadata, StatusObject} from '@grpc/grpc-js';
// import {ClientMethodDefinition} from '@grpc/grpc-js/build/src/make-client';

// describe('TopicSubscriptionRetryEligibilityStrategy', () => {
//   const testLogger = new DefaultMomentoLogger(
//     'TopicSubscriptionRetryEligibilityStrategyTest',
//     DefaultMomentoLoggerLevel.DEBUG
//   );
//   const eligibilityStrategy = new TopicSubscriptionRetryEligibilityStrategy(
//     testLogger
//   );

//   const testCases = [
//     {
//       description:
//         'should return true for INTERNAL status code and SUBSCRIBE request path',
//       grpcStatus: {code: Status.INTERNAL} as StatusObject,
//       grpcRequest: {
//         path: '/cache_client.pubsub.Pubsub/Subscribe',
//       } as ClientMethodDefinition<unknown, unknown>,
//       sdkError: new InternalServerError('test error'),
//       expected: true,
//     },
//     {
//       description:
//         'should return false for INTERNAL status code and GET request path',
//       grpcStatus: {code: Status.INTERNAL} as StatusObject,
//       grpcRequest: {
//         path: '/cache_client.Scs/Get',
//       } as ClientMethodDefinition<unknown, unknown>,
//       sdkError: new InternalServerError('test error'),
//       expected: false,
//     },
//     {
//       description:
//         'should return false for CANCELLED status code and SUBSCRIBE request path',
//       grpcStatus: {code: Status.CANCELLED} as StatusObject,
//       grpcRequest: {
//         path: '/cache_client.pubsub.Pubsub/Subscribe',
//       } as ClientMethodDefinition<unknown, unknown>,
//       sdkError: new CancelledError('test error'),
//       expected: false,
//     },
//     {
//       description:
//         'should return false for NOT_FOUND status code and SUBSCRIBE request path',
//       grpcStatus: {code: Status.NOT_FOUND} as StatusObject,
//       grpcRequest: {
//         path: '/cache_client.pubsub.Pubsub/Subscribe',
//       } as ClientMethodDefinition<unknown, unknown>,
//       sdkError: new CacheNotFoundError('test error'),
//       expected: false,
//     },
//     {
//       description:
//         'should return false for PERMISSION_DENIED status code and SUBSCRIBE request path',
//       grpcStatus: {code: Status.PERMISSION_DENIED} as StatusObject,
//       grpcRequest: {
//         path: '/cache_client.pubsub.Pubsub/Subscribe',
//       } as ClientMethodDefinition<unknown, unknown>,
//       sdkError: new PermissionError('test error'),
//       expected: false,
//     },
//     {
//       description:
//         'should return false for UNAUTHENTICATED status code and SUBSCRIBE request path',
//       grpcStatus: {code: Status.UNAUTHENTICATED} as StatusObject,
//       grpcRequest: {
//         path: '/cache_client.pubsub.Pubsub/Subscribe',
//       } as ClientMethodDefinition<unknown, unknown>,
//       sdkError: new AuthenticationError('test error'),
//       expected: false,
//     },
//     {
//       description:
//         'should return true for undefined grpcStatus and undefined request path',
//       grpcStatus: undefined as unknown as StatusObject,
//       grpcRequest: undefined as unknown as ClientMethodDefinition<
//         unknown,
//         unknown
//       >,
//       sdkError: new InternalServerError('test error'),
//       expected: true,
//     },
//   ];

//   testCases.forEach(
//     ({description, grpcStatus, grpcRequest, sdkError, expected}) => {
//       it(description, () => {
//         const requestMetadata = new Metadata();
//         const isEligible = eligibilityStrategy.isEligibleForResubscribe({
//           grpcStatus,
//           grpcRequest,
//           sdkError,
//           requestMetadata,
//         });
//         expect(isEligible).toBe(expected);
//       });
//     }
//   );
// });

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
