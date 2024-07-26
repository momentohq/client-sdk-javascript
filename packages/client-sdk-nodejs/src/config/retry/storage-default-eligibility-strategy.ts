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

// TODO: verify correct strings. Should be proto file's "<package name>.<service name>/<RPC name>" right?
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

    const errorMetadata = props.grpcStatus.metadata.get('err');
    // Expecting only one error condition in metadata
    if (errorMetadata.length === 1) {
      // TODO: check error metadata for specific conditions that should not be retried
      if (errorMetadata[0] === 'unacceptable retry condition') return false;
    } else {
      // If no metadata, fall back to checking idemopotency
      if (!retryableRequestTypes.includes(props.grpcRequest.path)) {
        this.logger.debug(
          `Request with type ${props.grpcRequest.path} is not retryable.`
        );
        return false;
      }
    }

    return true;
  }
}
