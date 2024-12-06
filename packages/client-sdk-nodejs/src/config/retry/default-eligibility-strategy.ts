import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {
  EligibilityStrategy,
  EligibleForRetryProps,
} from './eligibility-strategy';

const retryableGrpcStatusCodes: Array<Status> = [
  // including all the status codes for reference, but
  // commenting out the ones we don't want to retry on for now.

  // Status.OK,
  // Idempotent operations can be safely retried for CANCELLED errors. These may pop us sometimes during
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

const retryableRequestTypes: Array<string> = [
  '/cache_client.Scs/Get',
  '/cache_client.Scs/GetBatch',
  '/cache_client.Scs/Set',
  '/cache_client.Scs/SetBatch',
  // Not retryable: '/cache_client.Scs/SetIf',
  // SetIfNotExists is deprecated
  // Not retryable: '/cache_client.Scs/SetIfNotExists',
  '/cache_client.Scs/Delete',
  '/cache_client.Scs/KeysExist',
  // Not retryable: '/cache_client.Scs/Increment',
  // Not retryable: '/cache_client.Scs/UpdateTtl',
  '/cache_client.Scs/ItemGetTtl',
  '/cache_client.Scs/ItemGetType',

  '/cache_client.Scs/DictionaryGet',
  '/cache_client.Scs/DictionaryFetch',
  '/cache_client.Scs/DictionarySet',
  // Not retryable: '/cache_client.Scs/DictionaryIncrement',
  '/cache_client.Scs/DictionaryDelete',
  '/cache_client.Scs/DictionaryLength',

  '/cache_client.Scs/SetFetch',
  '/cache_client.Scs/SetSample',
  '/cache_client.Scs/SetUnion',
  '/cache_client.Scs/SetDifference',
  '/cache_client.Scs/SetContains',
  '/cache_client.Scs/SetLength',
  // Not retryable: '/cache_client.Scs/SetPop',

  // Not retryable: '/cache_client.Scs/ListPushFront',
  // Not retryable: '/cache_client.Scs/ListPushBack',
  // Not retryable: '/cache_client.Scs/ListPopFront',
  // Not retryable: '/cache_client.Scs/ListPopBack',
  // Not used: '/cache_client.Scs/ListErase',
  '/cache_client.Scs/ListRemove',
  '/cache_client.Scs/ListFetch',
  '/cache_client.Scs/ListLength',
  // Not retryable: '/cache_client.Scs/ListConcatenateFront',
  // Not retryable: '/cache_client.Scs/ListConcatenateBack',
  // Not retryable: '/cache_client.Scs/ListRetain',

  '/cache_client.Scs/SortedSetPut',
  '/cache_client.Scs/SortedSetFetch',
  '/cache_client.Scs/SortedSetGetScore',
  '/cache_client.Scs/SortedSetRemove',
  // Not retryable: '/cache_client.Scs/SortedSetIncrement',
  '/cache_client.Scs/SortedSetGetRank',
  '/cache_client.Scs/SortedSetLength',
  '/cache_client.Scs/SortedSetLengthByScore',

  '/cache_client.pubsub.Pubsub/Subscribe',
];

export class DefaultEligibilityStrategy implements EligibilityStrategy {
  private readonly logger: MomentoLogger;

  constructor(loggerFactory: MomentoLoggerFactory) {
    this.logger = loggerFactory.getLogger(this);
  }

  isEligibleForRetry(props: EligibleForRetryProps): boolean {
    if (!retryableGrpcStatusCodes.includes(props.grpcStatus.code)) {
      this.logger.debug(
        `Response with status code ${props.grpcStatus.code} is not retryable.`
      );
      return false;
    }

    if (!retryableRequestTypes.includes(props.grpcRequest.path)) {
      this.logger.debug(
        `Request with type ${props.grpcRequest.path} is not retryable.`
      );
      return false;
    }

    return true;
  }
}
