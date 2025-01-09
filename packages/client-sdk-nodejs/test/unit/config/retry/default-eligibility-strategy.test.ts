import {
  DefaultEligibilityStrategy,
  DefaultMomentoLoggerFactory,
} from '../../../../src';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {Metadata, StatusObject} from '@grpc/grpc-js';
import {ClientMethodDefinition} from '@grpc/grpc-js/build/src/make-client';

describe('DefaultEligibilityStrategy', () => {
  const testLoggerFactory = new DefaultMomentoLoggerFactory();
  const eligibilityStrategy = new DefaultEligibilityStrategy(testLoggerFactory);

  const testCases = [
    {
      description:
        'should return true for INTERNAL status code and GET request path',
      grpcStatus: {code: Status.INTERNAL} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Get'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: true,
    },
    {
      description:
        'should return true for INTERNAL status code and SET request path',
      grpcStatus: {code: Status.INTERNAL} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Set'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: true,
    },
    {
      description:
        'should return false for INTERNAL status code and dictionary increment request path',
      grpcStatus: {code: Status.INTERNAL} as StatusObject,
      grpcRequest: {
        path: '/cache_client.Scs/DictionaryIncrement',
      } as ClientMethodDefinition<unknown, unknown>,
      expected: false,
    },
    {
      description:
        'should return false for UNKNOWN status code and GET request path',
      grpcStatus: {code: Status.UNKNOWN} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Get'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: false,
    },
    {
      description:
        'should return false for UNKNOWN status code and SET request path',
      grpcStatus: {code: Status.UNKNOWN} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Set'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: false,
    },
    {
      description:
        'should return false for UNKNOWN status code and dictionary increment request path',
      grpcStatus: {code: Status.UNKNOWN} as StatusObject,
      grpcRequest: {
        path: '/cache_client.Scs/DictionaryIncrement',
      } as ClientMethodDefinition<unknown, unknown>,
      expected: false,
    },
    {
      description:
        'should return true for UNAVAILABLE status code and GET request path',
      grpcStatus: {code: Status.UNAVAILABLE} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Set'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: true,
    },
    {
      description:
        'should return true for UNAVAILABLE status code and SET request path',
      grpcStatus: {code: Status.UNAVAILABLE} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Set'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: true,
    },
    {
      description:
        'should return false for UNAVAILABLE status code and dictionary increment request path',
      grpcStatus: {code: Status.UNAVAILABLE} as StatusObject,
      grpcRequest: {
        path: '/cache_client.Scs/DictionaryIncrement',
      } as ClientMethodDefinition<unknown, unknown>,
      expected: false,
    },
    {
      description:
        'should return true for CANCELLED status code and GET request path',
      grpcStatus: {code: Status.CANCELLED} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Get'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: true,
    },
    {
      description:
        'should return true for CANCELLED status code and SET request path',
      grpcStatus: {code: Status.CANCELLED} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Set'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: true,
    },
    {
      description:
        'should return false for CANCELLED status code and dictionary increment request path',
      grpcStatus: {code: Status.CANCELLED} as StatusObject,
      grpcRequest: {
        path: '/cache_client.Scs/DictionaryIncrement',
      } as ClientMethodDefinition<unknown, unknown>,
      expected: false,
    },
    {
      description:
        'should return false for DEADLINE_EXCEEDED status code and GET request path',
      grpcStatus: {code: Status.DEADLINE_EXCEEDED} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Get'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: false,
    },
    {
      description:
        'should return false for DEADLINE_EXCEEDED status code and SET request path',
      grpcStatus: {code: Status.DEADLINE_EXCEEDED} as StatusObject,
      grpcRequest: {path: '/cache_client.Scs/Set'} as ClientMethodDefinition<
        unknown,
        unknown
      >,
      expected: false,
    },
    {
      description:
        'should return false for DEADLINE_EXCEEDED status code and dictionary increment request path',
      grpcStatus: {code: Status.DEADLINE_EXCEEDED} as StatusObject,
      grpcRequest: {
        path: '/cache_client.Scs/DictionaryIncrement',
      } as ClientMethodDefinition<unknown, unknown>,
      expected: false,
    },
  ];

  testCases.forEach(({description, grpcStatus, grpcRequest, expected}) => {
    it(description, () => {
      const requestMetadata = new Metadata();
      const isEligible = eligibilityStrategy.isEligibleForRetry({
        grpcStatus,
        grpcRequest,
        requestMetadata,
      });
      expect(isEligible).toBe(expected);
    });
  });
});
