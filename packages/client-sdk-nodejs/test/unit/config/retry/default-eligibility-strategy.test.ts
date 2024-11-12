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

  it('should return true for INTERNAL status code and GET request path', () => {
    const grpcStatus = {code: Status.INTERNAL} as StatusObject;
    const grpcRequest = {
      path: '/cache_client.Scs/Get',
    } as ClientMethodDefinition<unknown, unknown>;
    const requestMetadata = new Metadata();

    const isEligible = eligibilityStrategy.isEligibleForRetry({
      grpcStatus,
      grpcRequest,
      requestMetadata,
    });

    expect(isEligible).toBe(true);
  });

  it('should return false for UNKNOWN status code and GET request path', () => {
    const grpcStatus = {code: Status.UNKNOWN} as StatusObject;
    const grpcRequest = {
      path: '/cache_client.Scs/Get',
    } as ClientMethodDefinition<unknown, unknown>;
    const requestMetadata = new Metadata();

    const isEligible = eligibilityStrategy.isEligibleForRetry({
      grpcStatus,
      grpcRequest,
      requestMetadata,
    });

    expect(isEligible).toBe(false);
  });

  it('should return true for UNAVAILABLE status code and SET request path', () => {
    const grpcStatus = {code: Status.UNAVAILABLE} as StatusObject;
    const grpcRequest = {
      path: '/cache_client.Scs/Set',
    } as ClientMethodDefinition<unknown, unknown>;
    const requestMetadata = new Metadata();

    const isEligible = eligibilityStrategy.isEligibleForRetry({
      grpcStatus,
      grpcRequest,
      requestMetadata,
    });

    expect(isEligible).toBe(true);
  });

  it('should return true for CANCELLED status code and GET request path', () => {
    const grpcStatus = {code: Status.CANCELLED} as StatusObject;
    const grpcRequest = {
      path: '/cache_client.Scs/Get',
    } as ClientMethodDefinition<unknown, unknown>;
    const requestMetadata = new Metadata();

    const isEligible = eligibilityStrategy.isEligibleForRetry({
      grpcStatus,
      grpcRequest,
      requestMetadata,
    });

    expect(isEligible).toBe(true);
  });

  it('should return false for CANCELLED status code and SET request path', () => {
    const grpcStatus = {code: Status.CANCELLED} as StatusObject;
    const grpcRequest = {
      path: '/cache_client.Scs/Set',
    } as ClientMethodDefinition<unknown, unknown>;
    const requestMetadata = new Metadata();

    const isEligible = eligibilityStrategy.isEligibleForRetry({
      grpcStatus,
      grpcRequest,
      requestMetadata,
    });

    expect(isEligible).toBe(false);
  });
});
