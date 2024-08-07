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
      switch (errorMetadata[0].toString()) {
        case 'momento_general_err':
          return false;
        case 'server_is_busy': {
          // Retry disposition will show up only for err metadata "server_is_busy"
          const retryMetadata =
            props.grpcStatus.metadata.get('retry_disposition');
          if (retryMetadata.length === 1) {
            const retryDisposition = retryMetadata[0].toString();
            switch (retryMetadata[0].toString()) {
              case 'retryable':
                // Retryable = could retry soon (default 100ms)
                return true;
              case 'possibly_retryable':
                // Possibly retryable = could retry in a second or two
                return true; // return a value here instead?
              default:
                this.logger.debug(
                  `Unknown retry disposition value: ${retryDisposition}`
                );
                return false;
            }
          }
          return false;
        }
        case 'invalid_type':
          return false;
        case 'item_not_found':
          return false;
        case 'store_not_found':
          return false;
        default:
          this.logger.debug(
            `Unknown error metadata value: ${errorMetadata[0].toString()}`
          );
          return false;
      }
    } else {
      // If no metadata to check, fall back to checking RPC idemopotency
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
