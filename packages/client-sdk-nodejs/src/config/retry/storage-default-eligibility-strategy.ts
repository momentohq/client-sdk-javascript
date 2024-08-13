import {MomentoLogger, MomentoLoggerFactory} from '../../';
import {Status} from '@grpc/grpc-js/build/src/constants';
import {
  EligibilityStrategy,
  EligibleForRetryProps,
} from './eligibility-strategy';
import {Metadata} from '@grpc/grpc-js';

const retryableGrpcStatusCodes: Array<Status> = [
  // including all the status codes for reference, but
  // commenting out the ones we don't want to retry on for now.

  // Status.OK,
  // Status.CANCELLED,
  // Status.UNKNOWN,
  // Status.INVALID_ARGUMENT,
  Status.DEADLINE_EXCEEDED,
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
  '/store.Store/Put',
  '/store.Store/Get',
  '/store.Store/Delete',
];

export class DefaultStorageEligibilityStrategy implements EligibilityStrategy {
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

    // If retry disposition metadata is available and the value is "retryable",
    // it is safe to retry regardless of idempotency.
    const retryMetadata = this.getRetryDispositionMetadata(
      props.grpcStatus.metadata
    );
    if (retryMetadata === 'retryable') {
      return true;
    }

    // Otherwise, if there is no retry metadata or the retry disposition is
    // "possibly_retryable", it is safe to retry only idempotent commands.
    if (!retryableRequestTypes.includes(props.grpcRequest.path)) {
      this.logger.debug(
        `Request with type ${props.grpcRequest.path} is not retryable.`
      );
      return false;
    }

    return true;
  }

  private getRetryDispositionMetadata(metadata: Metadata): string | undefined {
    const retryMetadata = metadata.get('retry_disposition');
    if (retryMetadata.length === 1) {
      return retryMetadata[0].toString();
    }
    return undefined;
  }
}
