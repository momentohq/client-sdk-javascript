import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {
  EligibilityStrategy,
  EligibleForRetryProps,
} from './eligibility-strategy';

const retryableWriteGrpcStatusCodes: Array<Status> = [
  // including all the status codes for reference, but
  // commenting out the ones we don't want to retry on for now.

  // Status.OK,
  // Status.CANCELLED,
  // Status.UNKNOWN,
  // Status.INVALID_ARGUMENT,
  // Status.DEADLINE_EXCEEDED,
  // Status.NOT_FOUND,
  // Status.ALREADY_EXISTS,
  // Status.PERMISSION_DENIED,
  // Status.RESOURCE_EXHAUSTED,
  // Status.FAILED_PRECONDITION,
  // Status.ABORTED,
  // Status.OUT_OF_RANGE,
  // Status.UNIMPLEMENTED,
  Status.INTERNAL,
  Status.UNAVAILABLE,
  // Status.DATA_LOSS,
  // Status.UNAUTHENTICATED
];

const retryableReadGrpcStatusCodes: Array<Status> = [
  // including all the status codes for reference, but
  // commenting out the ones we don't want to retry on for now.

  // Status.OK,
  // Read requests can be safely retried for CANCELLED errors. These may pop us sometimes during
  // client or server side deployments
  Status.CANCELLED,
  // Status.UNKNOWN,
  // Status.INVALID_ARGUMENT,
  // Status.DEADLINE_EXCEEDED,
  // Status.NOT_FOUND,
  // Status.ALREADY_EXISTS,
  // Status.PERMISSION_DENIED,
  // Status.RESOURCE_EXHAUSTED,
  // Status.FAILED_PRECONDITION,
  // Status.ABORTED,
  // Status.OUT_OF_RANGE,
  // Status.UNIMPLEMENTED,
  Status.INTERNAL,
  Status.UNAVAILABLE,
  // Status.DATA_LOSS,
  // Status.UNAUTHENTICATED
];

const retryableWriteRequestTypes: Array<string> = [
  '/cache_client.Scs/Set',
  '/cache_client.Scs/Delete',
  '/cache_client.Scs/DictionarySet',
  // not idempotent: '/cache_client.Scs/DictionaryIncrement',
  '/cache_client.Scs/DictionaryDelete',
  '/cache_client.Scs/SetUnion',
  // not idempotent: '/cache_client.Scs/ListPushFront',
  // not idempotent: '/cache_client.Scs/ListPushBack',
  // not idempotent: '/cache_client.Scs/ListPopFront',
  // not idempotent: '/cache_client.Scs/ListPopBack',
  /*
   *  Warning: in the future, this may not be idempotent
   *  Currently it supports removing all occurrences of a value.
   *  In the future, we may also add "the first/last N occurrences of a value".
   *  In the latter case it is not idempotent.
   */
  '/cache_client.Scs/ListRemove',
  // not idempotent: '/cache_client.Scs/ListConcatenateFront',
  // not idempotent: '/cache_client.Scs/ListConcatenateBack'
];

const retryableReadRequestTypes: Array<string> = [
  '/cache_client.Scs/Get',
  '/cache_client.Scs/DictionaryGet',
  '/cache_client.Scs/DictionaryFetch',
  '/cache_client.Scs/SetDifference',
  '/cache_client.Scs/SetFetch',
  '/cache_client.Scs/ListFetch',
  '/cache_client.Scs/ListLength',
];

export class DefaultEligibilityStrategy implements EligibilityStrategy {
  private readonly logger: MomentoLogger;

  constructor(loggerFactory: MomentoLoggerFactory) {
    this.logger = loggerFactory.getLogger(this);
  }

  isEligibleForRetry(props: EligibleForRetryProps): boolean {
    if (
      retryableReadGrpcStatusCodes.includes(props.grpcStatus.code) &&
      retryableReadRequestTypes.includes(props.grpcRequest.path)
    ) {
      return true;
    }

    if (
      retryableWriteGrpcStatusCodes.includes(props.grpcStatus.code) &&
      retryableWriteRequestTypes.includes(props.grpcRequest.path)
    ) {
      return true;
    }

    this.logger.debug(
      `Request with type ${props.grpcRequest.path} and status code ${props.grpcStatus.code} is not retryable.`
    );
    return false;
  }
}
